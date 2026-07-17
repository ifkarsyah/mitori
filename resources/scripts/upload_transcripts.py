"""Upload fetched transcripts (see fetch_transcripts.py) straight to Supabase
via PostgREST, matched back to each video by URL. Avoids routing potentially
large transcript text through anything other than a direct HTTP request.

Usage: uv run scripts/upload_transcripts.py <transcripts_dir>
(run from the resources/ directory; reads SUPABASE_URL/SUPABASE_KEY from env)
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request
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


def main():
    if len(sys.argv) != 2:
        print("Usage: upload_transcripts.py <transcripts_dir>", file=sys.stderr)
        sys.exit(1)

    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    supabase_key = os.environ["SUPABASE_KEY"]
    transcripts_dir = Path(sys.argv[1])

    updated = 0
    skipped = 0

    for path in sorted((YOUTUBE_DIR / "videos").rglob("*.md")):
        frontmatter, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        url = frontmatter.get("url", "")
        video_id = extract_video_id(url)
        if not video_id:
            continue

        transcript_file = transcripts_dir / f"{video_id}.txt"
        if not transcript_file.exists():
            skipped += 1
            continue

        transcript = transcript_file.read_text(encoding="utf-8").strip()
        if not transcript:
            skipped += 1
            continue

        query = urllib.parse.urlencode({"url": f"eq.{url}"})
        endpoint = f"{supabase_url}/rest/v1/resource?{query}"
        body = json.dumps({"transcript": transcript}).encode("utf-8")

        req = urllib.request.Request(
            endpoint,
            data=body,
            method="PATCH",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 204):
                    updated += 1
                else:
                    print(f"unexpected status {resp.status} for {video_id}", file=sys.stderr)
        except urllib.error.HTTPError as e:
            print(f"failed for {video_id}: {e.code} {e.reason}", file=sys.stderr)

    print(f"Updated {updated} resources, skipped {skipped} (no transcript file).")


if __name__ == "__main__":
    main()
