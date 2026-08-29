"""Dump every table in the mitori Supabase project to CSV, one file per table.

The database holds a lot that exists nowhere else in this repo — the Japanese
vocabulary, 2700+ sentences with meanings, the per-word kanji breakdowns, the
kanji clusters. This makes that recoverable from git and gives us a reference
snapshot to diff against when the schema changes.

Reads credentials from SUPABASE_URL/SUPABASE_KEY, falling back to
app/.env.local (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) so it runs
with no setup. Stdlib only — no dependencies, same as resources/scripts.

Usage: python3 scripts/export_db.py [out_dir]   (default: db-export/)
"""

import csv
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT_DIR = REPO_ROOT / "db-export"
ENV_LOCAL = REPO_ROOT / "app" / ".env.local"

PAGE_SIZE = 1000

# Ordered so a human reading the export meets the vocabulary spine first.
TABLES = [
    "language",
    "concept",
    "context",
    "source",
    "kotoba",
    "kanji",
    "word_kanji",
    "sentences",
    "sentence_kotoba",
    "grammar_point",
    "resource_channel",
    "resource",
    "captures",
]


def read_env_local() -> dict[str, str]:
    if not ENV_LOCAL.exists():
        return {}
    values = {}
    for line in ENV_LOCAL.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def credentials() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not (url and key):
        env = read_env_local()
        url = url or env.get("VITE_SUPABASE_URL")
        key = key or env.get("VITE_SUPABASE_PUBLISHABLE_KEY")
    if not (url and key):
        sys.exit(
            "missing credentials: set SUPABASE_URL and SUPABASE_KEY, "
            f"or provide {ENV_LOCAL.relative_to(REPO_ROOT)}"
        )
    return url.rstrip("/"), key


def fetch_page(base_url: str, key: str, table: str, offset: int) -> list[dict]:
    query = f"select=*&order=id.asc&limit={PAGE_SIZE}&offset={offset}"
    request = urllib.request.Request(
        f"{base_url}/rest/v1/{table}?{query}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_all(base_url: str, key: str, table: str) -> list[dict]:
    rows: list[dict] = []
    while True:
        page = fetch_page(base_url, key, table, len(rows))
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            return rows


def cell(value) -> str:
    """Arrays and nested objects round-trip as JSON so nothing is silently flattened."""
    if value is None:
        return ""
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def write_csv(path: Path, rows: list[dict]) -> None:
    # Union of keys, so a row with a NULL-only column still contributes its header.
    columns: list[str] = []
    for row in rows:
        for column in row:
            if column not in columns:
                columns.append(column)

    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(columns)
        for row in rows:
            writer.writerow([cell(row.get(column)) for column in columns])


def main() -> None:
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    base_url, key = credentials()

    total = 0
    for table in TABLES:
        try:
            rows = fetch_all(base_url, key, table)
        except urllib.error.HTTPError as error:
            # A table in the list may not exist yet (or any more); say so rather
            # than aborting a backup that is otherwise complete.
            print(f"  {table}: skipped ({error.code})", file=sys.stderr)
            continue

        if not rows:
            print(f"  {table}: empty")
            continue

        write_csv(out_dir / f"{table}.csv", rows)
        total += len(rows)
        print(f"  {table}: {len(rows)} rows")

    print(f"exported {total} rows to {out_dir}")


if __name__ == "__main__":
    main()
