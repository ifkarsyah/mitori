"""Upload the syllabus concept CSVs straight into the syllabus_import staging table.

Routing 1700+ rows through a SQL literal is slow and expensive; PostgREST takes
them as JSON in a handful of requests instead, and the migration then joins
against the staging table with a few lines of SQL.

Reads credentials the same way as scripts/export_db.py. Stdlib only.

Usage: python3 syllabus/upload_syllabus.py    (run from the repo root)
"""

import csv
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from export_db import credentials  # noqa: E402  (shares the same credential handling)

REPO_ROOT = Path(__file__).resolve().parent.parent
CONCEPTS_DIR = REPO_ROOT / "syllabus" / "concepts"
BATCH = 200


def load_rows() -> list[dict]:
    rows = []
    for path in sorted(CONCEPTS_DIR.glob("*.csv")):
        for row in csv.DictReader(path.open(encoding="utf-8")):
            ids = [i.strip() for i in row["existing_concept_ids"].split(";") if i.strip()]
            rows.append(
                {
                    "slug": row["slug"].strip(),
                    "gloss": row["gloss"].strip(),
                    "part_of_speech": row["part_of_speech"].strip() or None,
                    "tier": int(row["tier"]),
                    "category_slug": path.stem,
                    # Kept as text; the migration parses it. Lowest id is the survivor.
                    "existing_ids": ";".join(sorted(ids, key=int)) or None,
                }
            )
    return rows


def post(base_url: str, key: str, batch: list[dict]) -> None:
    request = urllib.request.Request(
        f"{base_url}/rest/v1/syllabus_import",
        data=json.dumps(batch, ensure_ascii=False).encode("utf-8"),
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(request).read()
    except urllib.error.HTTPError as error:
        sys.exit(f"upload failed ({error.code}): {error.read().decode('utf-8')[:400]}")


def main() -> None:
    base_url, key = credentials()
    rows = load_rows()
    for i in range(0, len(rows), BATCH):
        post(base_url, key, rows[i : i + BATCH])
        print(f"  uploaded {min(i + BATCH, len(rows))}/{len(rows)}")
    print(f"staged {len(rows)} syllabus concepts")


if __name__ == "__main__":
    main()
