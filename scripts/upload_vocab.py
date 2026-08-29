"""Load reviewed vocabulary CSVs for one language straight into kotoba.

Rows are keyed on concept slug rather than concept id, so the files stay
readable and survive any renumbering. Everything goes through PostgREST in
batches — routing hundreds of rows through a SQL literal is slow and expensive.

CSV columns: concept_slug, gloss, word, reading, part_of_speech, level, note
(gloss and note are for the human reviewing the file; only the rest is loaded.)

Usage: python3 scripts/upload_vocab.py <language-code>   e.g. zh
(run from the repo root; reads vocab/<code>/*.csv)
"""

import csv
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_db import credentials  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
REQUIRED = {"concept_slug", "gloss", "word", "reading", "part_of_speech", "level", "note"}
BATCH = 200


def get(base_url: str, key: str, path: str) -> list[dict]:
    request = urllib.request.Request(
        f"{base_url}/rest/v1/{path}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def concept_ids_by_slug(base_url: str, key: str) -> dict[str, int]:
    ids: dict[str, int] = {}
    offset = 0
    while True:
        page = get(base_url, key, f"concept?select=id,slug&slug=not.is.null&limit=1000&offset={offset}")
        if not page:
            return ids
        for row in page:
            ids[row["slug"]] = row["id"]
        offset += len(page)


def load_rows(language: str) -> list[dict]:
    directory = REPO_ROOT / "vocab" / language
    paths = sorted(directory.glob("*.csv"))
    if not paths:
        sys.exit(f"no CSV files in {directory}")

    rows, errors = [], []
    for path in paths:
        reader = csv.DictReader(path.open(encoding="utf-8"), restkey="_extra")
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            sys.exit(f"{path.name}: missing columns {sorted(missing)}")
        for line_no, row in enumerate(reader, start=2):
            where = f"{path.name}:{line_no}"
            if row.get("_extra"):
                errors.append(f"{where}: too many fields — quote any value containing a comma")
                continue
            if not row["word"].strip():
                continue  # deliberately blank: no good word for this concept
            rows.append({**{k: (v or "").strip() for k, v in row.items() if k != "_extra"}, "_where": where})
    if errors:
        sys.exit("\n".join(errors))
    return rows


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: upload_vocab.py <language-code>")
    language = sys.argv[1]
    base_url, key = credentials()

    rows = load_rows(language)
    slugs = concept_ids_by_slug(base_url, key)

    payload, errors, seen = [], [], {}
    for row in rows:
        slug = row["concept_slug"]
        if slug not in slugs:
            errors.append(f"{row['_where']}: no concept with slug {slug!r}")
            continue
        if slug in seen:
            errors.append(f"{row['_where']}: slug {slug!r} already used at {seen[slug]}")
            continue
        seen[slug] = row["_where"]
        payload.append(
            {
                "word": row["word"],
                "language": language,
                "concept_id": slugs[slug],
                "reading": row["reading"] or None,
                "part_of_speech": row["part_of_speech"] or None,
                "level": row["level"] or None,
                # Meanings mirror the concept gloss; the concept is the meaning.
                "meanings": [row["gloss"]],
            }
        )
    if errors:
        sys.exit("\n".join(errors))

    # Skip concepts that already have a word in this language, so re-running is safe.
    existing = set()
    offset = 0
    while True:
        page = get(base_url, key, f"kotoba?select=concept_id&language=eq.{language}&limit=1000&offset={offset}")
        if not page:
            break
        existing.update(r["concept_id"] for r in page if r["concept_id"] is not None)
        offset += len(page)
    fresh = [r for r in payload if r["concept_id"] not in existing]

    for i in range(0, len(fresh), BATCH):
        batch = fresh[i : i + BATCH]
        request = urllib.request.Request(
            f"{base_url}/rest/v1/kotoba",
            data=json.dumps(batch, ensure_ascii=False).encode("utf-8"),
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            urllib.request.urlopen(request).read()
        except urllib.error.HTTPError as error:
            sys.exit(f"insert failed ({error.code}): {error.read().decode('utf-8')[:400]}")
        print(f"  inserted {min(i + BATCH, len(fresh))}/{len(fresh)}")

    print(f"{len(rows)} rows read, {len(fresh)} inserted, {len(payload) - len(fresh)} already present")


if __name__ == "__main__":
    main()
