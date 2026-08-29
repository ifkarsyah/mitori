"""Check the syllabus draft for problems that would only surface at migration time.

Two of these are easy to create by hand and expensive to discover later:
concept.gloss is UNIQUE in the database, so a syllabus gloss that collides with
an existing concept it is not merging will fail the migration; and an existing
concept claimed by two syllabus entries would have to be split, not merged.

Usage: python3 syllabus/validate.py      (run from the repo root)
"""

import csv
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SYLLABUS = REPO_ROOT / "syllabus"
CONCEPTS_DIR = SYLLABUS / "concepts"
CATEGORIES = SYLLABUS / "categories.csv"
EXPORTED_CONCEPTS = REPO_ROOT / "db-export" / "concept.csv"

REQUIRED = ["slug", "gloss", "part_of_speech", "tier", "existing_concept_ids", "note"]
PARTS_OF_SPEECH = {
    "noun", "verb", "adjective", "adverb", "pronoun", "numeral",
    "preposition", "conjunction", "determiner", "interjection", "phrase",
}
TIERS = {"1", "2", "3"}


def load_categories() -> tuple[set[str], set[str]]:
    rows = list(csv.DictReader(CATEGORIES.open(encoding="utf-8")))
    slugs = {r["slug"] for r in rows}
    parents = {r["parent_slug"] for r in rows if r["parent_slug"]}
    return slugs, slugs - parents  # all slugs, leaf slugs


def main() -> None:
    errors: list[str] = []
    category_slugs, leaf_slugs = load_categories()

    existing = {r["id"]: r["gloss"] for r in csv.DictReader(EXPORTED_CONCEPTS.open(encoding="utf-8"))}

    seen_slugs: dict[str, str] = {}
    seen_glosses: dict[str, str] = {}
    claimed: dict[str, str] = {}
    total = 0
    by_tier = {"1": 0, "2": 0, "3": 0}

    files = sorted(CONCEPTS_DIR.glob("*.csv")) if CONCEPTS_DIR.exists() else []
    if not files:
        sys.exit(f"no concept files in {CONCEPTS_DIR}")

    for path in files:
        category = path.stem
        if category not in category_slugs:
            errors.append(f"{path.name}: no category with slug {category!r}")
        elif category not in leaf_slugs:
            errors.append(f"{path.name}: {category!r} has child categories; put concepts on a leaf")

        reader = csv.DictReader(path.open(encoding="utf-8"))
        missing = set(REQUIRED) - set(reader.fieldnames or [])
        if missing:
            errors.append(f"{path.name}: missing columns {sorted(missing)}")
            continue

        for line_no, row in enumerate(reader, start=2):
            where = f"{path.name}:{line_no}"
            total += 1

            slug, gloss = row["slug"].strip(), row["gloss"].strip()
            if not slug or not gloss:
                errors.append(f"{where}: slug and gloss are required")
                continue
            if slug in seen_slugs:
                errors.append(f"{where}: duplicate slug {slug!r} (also {seen_slugs[slug]})")
            seen_slugs[slug] = where
            if gloss in seen_glosses:
                errors.append(f"{where}: duplicate gloss {gloss!r} (also {seen_glosses[gloss]}) — gloss is UNIQUE")
            seen_glosses[gloss] = where

            if row["part_of_speech"].strip() not in PARTS_OF_SPEECH:
                errors.append(f"{where}: part_of_speech {row['part_of_speech']!r} not recognised")
            tier = row["tier"].strip()
            if tier not in TIERS:
                errors.append(f"{where}: tier {tier!r} must be 1, 2 or 3")
            else:
                by_tier[tier] += 1

            merged_glosses = []
            for concept_id in filter(None, (p.strip() for p in row["existing_concept_ids"].split(";"))):
                if concept_id not in existing:
                    errors.append(f"{where}: existing_concept_ids {concept_id} not in db-export/concept.csv")
                    continue
                if concept_id in claimed:
                    errors.append(f"{where}: concept {concept_id} already claimed by {claimed[concept_id]}")
                claimed[concept_id] = where
                merged_glosses.append(existing[concept_id])

            # A syllabus gloss identical to an existing concept it is NOT merging
            # would violate concept.gloss UNIQUE when the syllabus is inserted.
            if gloss in existing.values() and gloss not in merged_glosses:
                clashing = [i for i, g in existing.items() if g == gloss]
                errors.append(
                    f"{where}: gloss {gloss!r} already exists as concept {clashing[0]} "
                    "but is not listed in existing_concept_ids"
                )

    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(f"\n{len(errors)} problem(s) across {len(files)} file(s)")

    covered = len(leaf_slugs & {p.stem for p in files})
    print(f"{total} concepts across {len(files)} of {len(leaf_slugs)} leaf categories")
    print(f"  tier 1: {by_tier['1']}   tier 2: {by_tier['2']}   tier 3: {by_tier['3']}")
    print(f"  merging {len(claimed)} of {len(existing)} existing concepts")
    print(f"  {len(leaf_slugs) - covered} leaf categories still to draft")


if __name__ == "__main__":
    main()
