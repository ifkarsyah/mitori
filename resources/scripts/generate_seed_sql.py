"""Turn the reviewed resources CSV (see export_resources.py) into idempotent
seed SQL for the resource_channel/resource tables.

Usage: uv run scripts/generate_seed_sql.py <reviewed.csv> > seed.sql
(run from the resources/ directory)
"""

import csv
import sys
from pathlib import Path

YOUTUBE_DIR = Path(__file__).resolve().parent.parent / "youtube"


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---"):
        return {}, text
    _, fm_block, body = text.split("---", 2)
    frontmatter = {}
    for line in fm_block.strip().splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        frontmatter[key.strip()] = value.strip()
    return frontmatter, body.strip()


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_str_or_null(value: str) -> str:
    return sql_str(value) if value else "NULL"


def load_channel_descriptions() -> dict[str, str]:
    descriptions = {}
    for path in sorted((YOUTUBE_DIR / "channels").glob("*.md")):
        frontmatter, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        slug = frontmatter.get("id", path.stem)
        # Body is "# Title\n\ndescription paragraph(s)" - drop the heading line.
        lines = [line for line in body.splitlines() if not line.startswith("# ")]
        descriptions[slug] = "\n".join(lines).strip()
    return descriptions


def main():
    if len(sys.argv) != 2:
        print("Usage: generate_seed_sql.py <reviewed.csv>", file=sys.stderr)
        sys.exit(1)

    descriptions = load_channel_descriptions()
    with open(sys.argv[1], newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    channels = {}
    for row in rows:
        slug = row["channel_slug"]
        channels.setdefault(slug, {
            "name": row["channel_name"],
            "url": row["channel_url"],
            "description": descriptions.get(slug, ""),
        })

    print("-- Seed data for resource_channel + resource, generated from")
    print("-- resources/scripts/generate_seed_sql.py. Safe to re-run.")
    print()
    print("INSERT INTO public.resource_channel (platform, slug, name, url, description) VALUES")
    channel_values = [
        f"    ('youtube', {sql_str(slug)}, {sql_str(c['name'])}, "
        f"{sql_str_or_null(c['url'])}, {sql_str_or_null(c['description'])})"
        for slug, c in sorted(channels.items())
    ]
    print(",\n".join(channel_values))
    print("ON CONFLICT (slug) DO UPDATE SET")
    print("    name = excluded.name, url = excluded.url, description = excluded.description;")
    print()

    print("INSERT INTO public.resource (channel_id, title, url, category, context_id)")
    print("SELECT rc.id, v.title, v.url, v.category, ctx.id")
    print("FROM (VALUES")
    resource_values = [
        f"    ({sql_str(row['channel_slug'])}::text, {sql_str(row['title'])}, "
        f"{sql_str(row['url'])}, {sql_str_or_null(row['category_guess'])}, "
        f"{sql_str_or_null(row['context_guess'])})"
        for row in rows
    ]
    print(",\n".join(resource_values))
    print(") AS v(channel_slug, title, url, category, context_name)")
    print("JOIN public.resource_channel rc ON rc.slug = v.channel_slug")
    print("LEFT JOIN public.context ctx ON ctx.name = v.context_name")
    print("ON CONFLICT (url) DO NOTHING;")


if __name__ == "__main__":
    main()
