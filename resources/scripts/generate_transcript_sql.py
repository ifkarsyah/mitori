"""Turn fetched transcripts (see fetch_transcripts.py) into UPDATE SQL for
the resource table, matched back to each video by URL.

Usage: uv run scripts/generate_transcript_sql.py <transcripts_dir> > update.sql
(run from the resources/ directory)
"""

import re
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


def extract_video_id(url: str) -> str | None:
    match = re.search(r"(?:v=|youtu\.be/)([^&]+)", url)
    return match.group(1) if match else None


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main():
    if len(sys.argv) != 2:
        print("Usage: generate_transcript_sql.py <transcripts_dir>", file=sys.stderr)
        sys.exit(1)

    transcripts_dir = Path(sys.argv[1])
    statements = []

    for path in sorted((YOUTUBE_DIR / "videos").rglob("*.md")):
        frontmatter, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        url = frontmatter.get("url", "")
        video_id = extract_video_id(url)
        if not video_id:
            continue

        transcript_file = transcripts_dir / f"{video_id}.txt"
        if not transcript_file.exists():
            continue

        transcript = transcript_file.read_text(encoding="utf-8").strip()
        if not transcript:
            continue

        statements.append(
            f"UPDATE public.resource SET transcript = {sql_str(transcript)} WHERE url = {sql_str(url)};"
        )

    print("\n".join(statements))
    print(f"-- {len(statements)} videos matched", file=sys.stderr)


if __name__ == "__main__":
    main()
