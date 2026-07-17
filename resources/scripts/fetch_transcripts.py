"""Fetch YouTube captions (manual, falling back to auto-generated) for every
video under resources/youtube/videos/ and clean them into plain transcript
text. Writes one .txt file per video (named by video id) into a target dir.

Coverage will be partial: not every video has captions at all, and
auto-generated Japanese captions are often rough (no punctuation,
occasional mis-transcriptions) - treat them as a study aid, not ground truth.

Usage: uv run scripts/fetch_transcripts.py <output_dir>
(run from the resources/ directory)
"""

import re
import subprocess
import sys
import tempfile
import time
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


def iter_video_urls():
    for path in sorted((YOUTUBE_DIR / "videos").rglob("*.md")):
        frontmatter, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        url = frontmatter.get("url", "")
        if url:
            yield url


def extract_video_id(url: str) -> str | None:
    match = re.search(r"(?:v=|youtu\.be/)([^&]+)", url)
    return match.group(1) if match else None


TAG_RE = re.compile(r"<[^>]+>")
TIMESTAMP_LINE_RE = re.compile(r"^\d{2}:\d{2}:\d{2}\.\d{3} --> ")


def clean_vtt(vtt_text: str) -> str:
    """Strips VTT timing/markup and collapses YouTube auto-caption's rolling
    duplicate cues (each cue often repeats the previous cue's text plus a
    few new words) down to one line per distinct phrase."""
    cues: list[str] = []
    current: list[str] = []

    def flush():
        if current:
            text = re.sub(r"\s+", " ", " ".join(current)).strip()
            if text:
                cues.append(text)
            current.clear()

    for line in vtt_text.splitlines():
        stripped = line.strip()
        if not stripped:
            flush()
            continue
        if stripped == "WEBVTT" or stripped.startswith(("Kind:", "Language:")):
            continue
        if TIMESTAMP_LINE_RE.match(stripped) or stripped.isdigit():
            flush()
            continue
        current.append(TAG_RE.sub("", line).strip())
    flush()

    finalized: list[str] = []
    for cue in cues:
        if not finalized:
            finalized.append(cue)
        elif cue == finalized[-1] or finalized[-1].startswith(cue):
            continue
        elif cue.startswith(finalized[-1]):
            finalized[-1] = cue
        else:
            finalized.append(cue)

    return "\n".join(finalized).strip()


def fetch_captions(url: str, workdir: Path) -> str | None:
    for flag in ("--write-sub", "--write-auto-sub"):
        cmd = [
            "yt-dlp",
            flag,
            "--sub-lang", "ja",
            "--sub-format", "vtt",
            "--skip-download",
            "--quiet",
            "--no-warnings",
            "-o", str(workdir / "%(id)s.%(ext)s"),
            url,
        ]
        subprocess.run(cmd, check=False, capture_output=True, timeout=60)
        vtt_files = list(workdir.glob("*.vtt"))
        if vtt_files:
            text = clean_vtt(vtt_files[0].read_text(encoding="utf-8"))
            for f in vtt_files:
                f.unlink()
            if text:
                return text
    return None


def main():
    if len(sys.argv) != 2:
        print("Usage: fetch_transcripts.py <output_dir>", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)

    urls = list(iter_video_urls())
    found = 0
    for i, url in enumerate(urls, 1):
        video_id = extract_video_id(url) or str(i)

        try:
            with tempfile.TemporaryDirectory() as tmp:
                transcript = fetch_captions(url, Path(tmp))
        except subprocess.TimeoutExpired:
            transcript = None

        if transcript:
            (out_dir / f"{video_id}.txt").write_text(transcript, encoding="utf-8")
            found += 1
            print(f"[{i}/{len(urls)}] found captions: {video_id}")
        else:
            print(f"[{i}/{len(urls)}] no captions: {video_id}")

        time.sleep(1)

    print(f"\n{found}/{len(urls)} videos had captions available.")


if __name__ == "__main__":
    main()
