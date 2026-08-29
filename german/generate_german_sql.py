"""Turn the reviewed German vocabulary CSVs in vocab/ into idempotent seed SQL.

Each row pairs an existing concept (already linked to its Japanese word) with the
German word realizing that same concept. Rows with an empty de_word are skipped:
they record concepts with no clean German equivalent (畳, お盆, 定期券), which stay
Japanese-only rather than getting a fabricated translation.

context_id and meanings are inherited from the concept's Japanese sibling at
insert time rather than duplicated into the CSV, so the CSV stays reviewable and
cannot drift from the Japanese row.

Usage: python3 generate_german_sql.py [batch-NN.csv ...] > seed.sql
(run from the german/ directory; with no arguments every batch is included)

The insert is idempotent — a concept that already has a German word is skipped —
so re-running over batches already seeded is a no-op.
"""

import csv
import sys
from pathlib import Path

VOCAB_DIR = Path(__file__).resolve().parent / "vocab"

REQUIRED_COLUMNS = {
    "concept_id",
    "gloss",
    "ja_word",
    "part_of_speech",
    "de_part_of_speech",
    "de_word",
    "de_gender",
    "de_plural",
    "de_cefr",
    "note",
}

GENDERS = {"der", "die", "das"}
CEFR_LEVELS = {"a1", "a2", "b1", "b2", "c1", "c2"}


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_str_or_null(value: str) -> str:
    return sql_str(value) if value else "NULL"


def load_rows(names: list[str]) -> list[dict[str, str]]:
    """Load every batch, or only the named ones (useful when seeding batch by batch)."""
    paths = [VOCAB_DIR / name for name in names] if names else sorted(VOCAB_DIR.glob("batch-*.csv"))
    missing = [str(p) for p in paths if not p.exists()]
    if missing:
        sys.exit(f"no such batch file(s): {', '.join(missing)}")
    if not paths:
        sys.exit(f"no batch-*.csv files found in {VOCAB_DIR}")

    rows = []
    for path in paths:
        with path.open(encoding="utf-8", newline="") as handle:
            # restkey catches rows with too many fields, which otherwise parse
            # silently — an unquoted comma in a gloss or note shifts every later
            # column and would quietly corrupt the row rather than fail.
            reader = csv.DictReader(handle, restkey="_extra")
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            if missing:
                sys.exit(f"{path.name}: missing columns {sorted(missing)}")
            for line_no, row in enumerate(reader, start=2):
                where = f"{path.name}:{line_no}"
                if row.get("_extra"):
                    sys.exit(f"{where}: too many fields — quote any gloss/note containing a comma")
                if any(value is None for value in row.values()):
                    sys.exit(f"{where}: too few fields")
                row["_source"] = where
                rows.append(row)
    return rows


def validate(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Return the insertable rows, exiting on any structural problem."""
    errors = []
    seen_concepts: dict[str, str] = {}
    seen_words: dict[str, str] = {}
    insertable = []

    for row in rows:
        where = row["_source"]
        concept_id = row["concept_id"].strip()

        if not concept_id.isdigit():
            errors.append(f"{where}: concept_id {concept_id!r} is not a number")
            continue
        if concept_id in seen_concepts:
            errors.append(f"{where}: concept_id {concept_id} already used at {seen_concepts[concept_id]}")
            continue
        seen_concepts[concept_id] = where

        word = row["de_word"].strip()
        if not word:
            # Deliberately untranslated — a note explaining why is required.
            if not row["note"].strip():
                errors.append(f"{where}: empty de_word needs a note explaining why")
            continue

        gender = row["de_gender"].strip().lower()
        plural = row["de_plural"].strip()
        cefr = row["de_cefr"].strip().lower()
        # The German word's own word class, which often differs from the concept's:
        # 昨日 is a noun, but German "gestern" is an adverb.
        pos = row["de_part_of_speech"].strip() or row["part_of_speech"].strip()

        if gender and gender not in GENDERS:
            errors.append(f"{where}: gender {gender!r} is not der/die/das")
        if cefr and cefr not in CEFR_LEVELS:
            errors.append(f"{where}: cefr {cefr!r} is not a1-c2")
        if pos == "noun" and not gender:
            errors.append(f"{where}: noun {word!r} has no gender")
        if pos != "noun" and gender:
            errors.append(f"{where}: non-noun {word!r} should not have a gender")
        if pos != "noun" and plural:
            errors.append(f"{where}: non-noun {word!r} should not have a plural")

        # /kotoba/:word routes by word, so two concepts sharing a German spelling
        # (Bank = bench / Bank = bank) would make one of them unreachable.
        if word in seen_words:
            errors.append(f"{where}: de_word {word!r} already used at {seen_words[word]}")
            continue
        seen_words[word] = where

        insertable.append(
            {
                "_batch": where.split(":")[0],
                "concept_id": concept_id,
                "word": word,
                "gender": gender,
                "plural": plural,
                "cefr": cefr,
                "pos": pos,
                "gloss": row["gloss"].strip(),
            }
        )

    if errors:
        sys.exit("\n".join(errors))
    return insertable


def emit(rows: list[dict[str, str]]) -> None:
    """One INSERT over a VALUES list.

    meanings and context_id come from the concept's Japanese sibling via the
    lateral join (lowest id wins when a concept has several synonyms), and the
    NOT EXISTS guard makes re-running a no-op.
    """
    print("-- Generated by german/generate_german_sql.py — do not edit by hand.")
    print(f"-- {len(rows)} German words, one per concept.")
    print(
        "INSERT INTO public.kotoba "
        "(word, language, concept_id, part_of_speech, gender, plural, cefr, meanings, context_id)"
    )
    print(
        "SELECT v.word, 'de', v.concept_id, v.pos, v.gender, v.plural, v.cefr, "
        "ja.meanings, ja.context_id"
    )
    print("FROM (VALUES")

    values = [
        f"  ({sql_str(row['word'])},{row['concept_id']},{sql_str_or_null(row['pos'])},"
        f"{sql_str_or_null(row['gender'])},{sql_str_or_null(row['plural'])},"
        f"{sql_str_or_null(row['cefr'])})"
        for row in rows
    ]
    print(",\n".join(values))

    print(") AS v(word, concept_id, pos, gender, plural, cefr)")
    print("CROSS JOIN LATERAL (")
    print("  SELECT k.meanings, k.context_id FROM public.kotoba k")
    print("  WHERE k.concept_id = v.concept_id AND k.language = 'ja'")
    print("  ORDER BY k.id LIMIT 1")
    print(") ja")
    print(
        "WHERE NOT EXISTS (SELECT 1 FROM public.kotoba e "
        "WHERE e.concept_id = v.concept_id AND e.language = 'de');"
    )


def main() -> None:
    # Always validate against every batch, so concept_id/de_word uniqueness is
    # checked across the whole set even when emitting a single batch.
    rows = load_rows([])
    insertable = validate(rows)

    selected = sys.argv[1:]
    if selected:
        wanted = set(selected)
        insertable = [row for row in insertable if row["_batch"] in wanted]

    emit(insertable)
    print(f"-- {len(rows)} rows validated across all batches, {len(insertable)} emitted.")


if __name__ == "__main__":
    main()
