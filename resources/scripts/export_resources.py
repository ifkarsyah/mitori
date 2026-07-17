"""Parse resources/youtube/{channels,videos} markdown into a review CSV.

Every video's frontmatter `category` field is a scraper placeholder (always
"listening") and can't be trusted, so this derives a better first-guess
category from folder structure and filename patterns, plus a context guess
matched against mitori's existing `context` table names. Both guess columns
are meant to be reviewed/corrected by hand before importing.

Usage: uv run scripts/export_resources.py > /path/to/review.csv
(run from the resources/ directory)
"""

import csv
import re
import sys
from pathlib import Path

YOUTUBE_DIR = Path(__file__).resolve().parent.parent / "youtube"

# Video frontmatter `channel:` is slugify(uploader name) at scrape time, which
# transliterates Japanese kanji via unidecode's Chinese pinyin rules and so
# doesn't match the channel file's own curated `id:` slug. Map the raw
# scraped values to the canonical channel id.
CHANNEL_SLUG_ALIASES = {
    "akanede-ri-ben-yu-jiao-shi": "akane-japanese-class",
    "kanamatohe-kanamatope": "kanatope-japanese",
}

# Fetched from the live `context` table (public.context) for guess-matching.
CONTEXT_NAMES = [
    "Animal", "Barber Shop", "Body", "Business / Work", "Clothing Store",
    "Cognitive", "Color", "Communication", "Comparison / Degree",
    "Direction / Position", "Drugstore", "E-commerce", "Electronic Store",
    "Emotion / Feeling", "Family / Home", "Finance & Banking",
    "Furniture Store", "Government & Administration", "Groceries Store",
    "Hospital / Clinic", "Housing & Real Estate", "Konbini",
    "Money / Shopping", "Movement", "Number / Quantity",
    "Phone & Mobile Carrier", "Restaurant", "School", "Size / Measurement",
    "Social Media & Apps", "Sports / Activity", "Station", "Time / Date",
    "Travel", "Variety Store (100-yen Shop)", "Weather / Nature",
]

# filename/folder keyword -> context name, checked in order, first match wins.
CONTEXT_KEYWORD_MAP = [
    ("izakaya", "Restaurant"),
    ("restaurant", "Restaurant"),
    ("cafe", "Restaurant"),
    ("takeout", "Restaurant"),
    ("kfc", "Restaurant"),
    ("konbini", "Konbini"),
    ("convenience-store", "Konbini"),
    ("clothing-store", "Clothing Store"),
    ("barber", "Barber Shop"),
    ("hair-salon", "Barber Shop"),
    ("classroom", "School"),
    ("supermarket", "Groceries Store"),
    ("hotel", "Travel"),
    ("taxi", "Travel"),
    ("airport", "Travel"),
    ("transportation", "Station"),
    ("station", "Station"),
    ("train", "Station"),
    ("phone-reservation", "Phone & Mobile Carrier"),
    ("furniture", "Furniture Store"),
]

# folder/filename keyword -> category, checked in order, first match wins.
CATEGORY_KEYWORD_MAP = [
    ("shadowing-role-play-practice", "shadowing"),
    ("listen-to", "listening-practice"),
    ("listening-practice", "listening-practice"),
    ("nohui-hua", "conversation"),  # の会話 (conversation), akane filename romanization
    ("hui-hua", "conversation"),
    ("nodan-yu", "vocabulary"),  # の単語 (vocabulary word), akane filename romanization
    ("vocabulary", "vocabulary"),
    ("tips", "tips"),
]

# Manual review corrections, keyed by YouTube video id, applied after the
# keyword guesses above. The frontmatter/filename heuristics can't read the
# actual (often Japanese) title, so these were reviewed by hand watching for
# keyword false positives (e.g. "Train Your Japanese Brain" matching the
# "train" -> Station context keyword) and titles the heuristics can't infer
# a category for at all. `None` clears a wrong guess rather than leaving it.
MANUAL_REVIEW = {
    "faKYinAtlIo": {"category": "conversation"},
    "ttLP3PGpBuM": {"category": "conversation", "context": "Business / Work"},
    "X9auVKiZgsM": {"category": "conversation", "context": "Travel"},
    "r-pp-Dpz5AA": {"category": "vocabulary", "context": "Restaurant"},
    "r20IdWOSBFE": {"category": "conversation"},
    "yNsjl7WFtRY": {"category": "conversation", "context": "Restaurant"},
    "W1BiwaKK5_I": {"category": "conversation"},
    "zRAIPAP6AO0": {"context": "Restaurant"},
    "5YIadrdOsnM": {"category": "vocabulary"},
    "R_X3F6q4xTU": {"context": "Travel"},
    "MhnFLmFr_fQ": {"context": "Family / Home"},
    "eShOGfMx9FI": {"context": "Groceries Store"},
    "lVSJn53pUsI": {"context": "Housing & Real Estate"},
    "gnoZDIpYKas": {"context": "Travel"},
    "D_4czELduwY": {"context": "Travel"},
    "iIkEj1rZWa0": {"category": "tips"},
    "PTX58pli-kI": {"context": "Restaurant"},
    "ihRjDwIyxk0": {"context": "Restaurant"},
    "t2JgRiOooPQ": {"context": "Hospital / Clinic"},
    "0B9HlL3O3o0": {"category": "conversation", "context": "Family / Home"},
    "QmIoIFPemxY": {"category": "conversation", "context": "Family / Home"},
    "VnTVz39FAVQ": {"category": "conversation"},
    "VbzFrVCB7mc": {"category": "conversation", "context": "Communication"},
    "p0YCPdNlq4Q": {"category": "tips", "context": None},
    "2iVWuHr0Q-w": {"context": "Travel"},
    "K1GEl1bdpIo": {"context": "Weather / Nature"},
    "JofrH93Kk1g": {"context": "Money / Shopping"},
}


def extract_video_id(url: str) -> str:
    match = re.search(r"[?&]v=([^&]+)", url)
    return match.group(1) if match else ""


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


def guess_from_keywords(haystack: str, keyword_map: list[tuple[str, str]]) -> str:
    haystack = haystack.lower()
    for keyword, guess in keyword_map:
        if keyword in haystack:
            return guess
    return ""


def load_channels() -> dict[str, dict[str, str]]:
    channels = {}
    for path in sorted((YOUTUBE_DIR / "channels").glob("*.md")):
        frontmatter, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        slug = frontmatter.get("id", path.stem)
        channels[slug] = {
            "channel_slug": slug,
            "channel_name": frontmatter.get("title", ""),
            "channel_url": frontmatter.get("url", ""),
        }
    return channels


def iter_videos():
    videos_dir = YOUTUBE_DIR / "videos"
    for path in sorted(videos_dir.rglob("*.md")):
        rel_folder = path.relative_to(videos_dir).parent
        # rel_folder is e.g. "akane-japanese-class" (flat) or
        # "speak-japanese-naturally/tips" (has a category subfolder).
        folder_parts = rel_folder.parts
        subfolder = folder_parts[1] if len(folder_parts) > 1 else ""
        yield path, subfolder


def main():
    channels = load_channels()
    rows = []
    for path, subfolder in iter_videos():
        frontmatter, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        channel_slug = frontmatter.get("channel", "")
        channel_slug = CHANNEL_SLUG_ALIASES.get(channel_slug, channel_slug)
        channel = channels.get(channel_slug, {})

        signal = f"{subfolder} {path.stem}"
        category_guess = subfolder or guess_from_keywords(signal, CATEGORY_KEYWORD_MAP)
        context_guess = frontmatter.get("context", "").strip()
        if context_guess:
            # Normalize a raw `context: restaurant` frontmatter value against
            # the real context table names where possible.
            match = next(
                (name for name in CONTEXT_NAMES if name.lower() == context_guess.lower()),
                "",
            )
            context_guess = match or context_guess
        else:
            context_guess = guess_from_keywords(signal, CONTEXT_KEYWORD_MAP)

        url = frontmatter.get("url", "")
        review = MANUAL_REVIEW.get(extract_video_id(url), {})
        if "category" in review:
            category_guess = review["category"] or ""
        if "context" in review:
            context_guess = review["context"] or ""

        rows.append({
            "channel_slug": channel_slug,
            "channel_name": channel.get("channel_name", ""),
            "channel_url": channel.get("channel_url", ""),
            "title": frontmatter.get("title", ""),
            "url": frontmatter.get("url", ""),
            "category_guess": category_guess,
            "context_guess": context_guess,
        })

    writer = csv.DictWriter(
        sys.stdout,
        fieldnames=[
            "channel_slug", "channel_name", "channel_url",
            "title", "url", "category_guess", "context_guess",
        ],
    )
    writer.writeheader()
    writer.writerows(rows)


if __name__ == "__main__":
    main()
