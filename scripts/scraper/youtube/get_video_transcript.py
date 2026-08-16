"""Fetches a YouTube video's transcript (captions) using yt-dlp and prints it as plain text.

Usage:
    uv run get_video_transcript.py <video_url_or_id> [--lang en]
"""

import argparse
import re
import sys


def fix_dash_prefixed_video_id(argv):
    """A bare video ID can start with '-' (e.g. '-RDyEFvnTXI'), which argparse would
    otherwise mistake for an unrecognized flag -- insert '--' right before it."""
    if argv and argv[-1].startswith("-") and argv[-1] not in ("-h", "--help"):
        return argv[:-1] + ["--", argv[-1]]
    return argv

# Third-party libraries managed by uv
import httpx
from yt_dlp import YoutubeDL


def normalize_url(video):
    """Accepts a full YouTube URL or a bare video ID and returns a full watch URL."""
    if video.startswith("http://") or video.startswith("https://"):
        return video
    return f"https://www.youtube.com/watch?v={video}"


def resolve_track_key(track_map, lang):
    """Finds the best key in `track_map` for `lang`.

    Some channels only expose region-qualified codes (e.g. 'en-US') rather than the
    bare code, and auto-translated tracks pollute the map with pivot keys like
    'aa-en-US' (translated *from* 'aa', not a real 'en' track) -- those must not match.
    Tries, in order: exact match, then any key starting with '<lang>-' (covers 'en-US',
    'en-GB', ...), preferring the shortest such key.
    """
    if lang in track_map:
        return lang
    candidates = sorted(k for k in track_map if k.startswith(f"{lang}-"))
    return candidates[0] if candidates else None


def pick_subtitle_track(info, lang):
    """Finds a subtitle track for `lang`, preferring manual captions over auto-generated ones.

    Returns (track, is_auto) or (None, False) if `lang` isn't available at all.
    """
    for track_map, is_auto in (
        (info.get("subtitles") or {}, False),
        (info.get("automatic_captions") or {}, True),
    ):
        key = resolve_track_key(track_map, lang)
        if key is None:
            continue
        tracks = track_map[key]
        vtt_tracks = [t for t in tracks if t.get("ext") == "vtt"]
        return (vtt_tracks[0] if vtt_tracks else tracks[0]), is_auto

    return None, False


def vtt_to_text(vtt_content):
    """Converts raw WebVTT caption content into deduplicated plain-text transcript lines.

    Auto-generated YouTube captions render as rolling/overlapping cues, so the same line
    of text is repeated across consecutive cue blocks with per-word timing tags
    (e.g. "<00:00:01.360><c> word</c>") -- those tags and repeated lines are stripped out.
    """
    tag_re = re.compile(r"<[^>]+>")
    skip_prefixes = ("WEBVTT", "Kind:", "Language:", "NOTE", "STYLE", "::cue")

    lines_out = []
    prev = None

    for raw_line in vtt_content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith(skip_prefixes) or "-->" in line or line.isdigit():
            continue

        text = tag_re.sub("", line).strip()
        if not text or text == prev:
            continue

        lines_out.append(text)
        prev = text

    return "\n".join(lines_out)


def fetch_transcript(video_url, lang="en"):
    """Returns (transcript_text, is_auto_generated, video_title) for `video_url`."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": [lang],
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)

    track, is_auto = pick_subtitle_track(info, lang)
    if not track:
        available = sorted({**(info.get("subtitles") or {}), **(info.get("automatic_captions") or {})})
        raise ValueError(
            f"No '{lang}' captions found for this video. "
            f"Available languages: {', '.join(available) if available else 'none'}"
        )

    response = httpx.get(track["url"], timeout=30)
    response.raise_for_status()

    return vtt_to_text(response.text), is_auto, info.get("title", "")


def main():
    parser = argparse.ArgumentParser(description="Fetch a YouTube video's transcript via yt-dlp.")
    parser.add_argument("video", help="YouTube video URL or bare video ID")
    parser.add_argument("--lang", default="en", help="Caption language code (default: en)")
    args = parser.parse_args(fix_dash_prefixed_video_id(sys.argv[1:]))

    video_url = normalize_url(args.video)

    try:
        transcript, is_auto, title = fetch_transcript(video_url, args.lang)
    except Exception as e:
        print(f"❌ Error fetching transcript: {e}", file=sys.stderr)
        sys.exit(1)

    kind = "auto-generated" if is_auto else "manual"
    print(f"# {title}", file=sys.stderr)
    print(f"# Captions: {args.lang} ({kind})\n", file=sys.stderr)
    print(transcript)


if __name__ == "__main__":
    main()
