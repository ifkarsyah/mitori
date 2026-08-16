"""Fetches a YouTube video's metadata via yt-dlp and prints it as a ready-to-paste
frontmatter block, matching the bookmark/video/youtube/<channel>/... note convention.

Usage:
    uv run get_video_detail.py <video_url_or_id>

Note: title/author/url/uploaded_at/duration all come straight from YouTube's own
metadata. `tool:` does NOT -- it's a judgment call about which named technologies the
video's *content* is actually about, which requires reading the transcript/description.
This script can only print the uploader's own video tags as an unreviewed hint (to
stderr) -- those are self-reported labels, not a content summary, so treat them as
candidates to prune, not as the answer.
"""

import argparse
import sys

# Third-party library managed by uv
from yt_dlp import YoutubeDL


def fix_dash_prefixed_video_id(argv):
    """A bare video ID can start with '-' (e.g. '-RDyEFvnTXI'), which argparse would
    otherwise mistake for an unrecognized flag -- insert '--' right before it."""
    if argv and argv[-1].startswith("-") and argv[-1] not in ("-h", "--help"):
        return argv[:-1] + ["--", argv[-1]]
    return argv


def normalize_url(video):
    """Accepts a full YouTube URL or a bare video ID and returns a full watch URL."""
    if video.startswith("http://") or video.startswith("https://"):
        return video
    return f"https://www.youtube.com/watch?v={video}"


def format_duration(seconds):
    """Formats seconds as MM:SS, or HH:MM:SS once it's an hour or longer."""
    if seconds is None:
        return "unknown"
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def format_upload_date(date_str):
    """Converts yt-dlp's YYYYMMDD upload_date into YYYY-MM-DD."""
    if not date_str or len(date_str) != 8:
        return "unknown"
    return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"


def fetch_detail(video_url):
    """Returns a dict of frontmatter-ready fields, plus the raw uploader tags."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)

    return {
        "title": info.get("title", ""),
        "author": info.get("channel") or info.get("uploader") or "",
        "url": f"https://www.youtube.com/watch?v={info.get('id')}",
        "uploaded_at": format_upload_date(info.get("upload_date")),
        "duration": format_duration(info.get("duration")),
        "tags": info.get("tags") or [],
    }


def main():
    parser = argparse.ArgumentParser(
        description="Fetch a YouTube video's metadata via yt-dlp and print it as frontmatter."
    )
    parser.add_argument("video", help="YouTube video URL or bare video ID")
    args = parser.parse_args(fix_dash_prefixed_video_id(sys.argv[1:]))

    video_url = normalize_url(args.video)

    try:
        detail = fetch_detail(video_url)
    except Exception as e:
        print(f"❌ Error fetching video detail: {e}", file=sys.stderr)
        sys.exit(1)

    print("---")
    print(f"title: {detail['title']}")
    print(f"author: {detail['author']}")
    print(f"url: {detail['url']}")
    print(f"uploaded_at: {detail['uploaded_at']}")
    print(f"duration: {detail['duration']}")
    print("tool:")
    print("  # TODO: fill in from actual video content -- see uploader tags on stderr")
    print("---")

    if detail["tags"]:
        print("\nUploader's own video tags (raw, unreviewed -- not authoritative for `tool:`):", file=sys.stderr)
        print(", ".join(detail["tags"]), file=sys.stderr)


if __name__ == "__main__":
    main()
