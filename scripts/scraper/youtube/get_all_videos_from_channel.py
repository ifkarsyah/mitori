import asyncio
import os
import re

from common import API_KEY, ENV_FILE, YOUTUBE_API_BASE, create_client
from get_all_playlist import get_all_playlists
from get_all_videos_from_playlist import get_all_videos

# --- CONFIGURATION: SET THE TARGET CHANNEL HERE ---
CHANNEL_HANDLE = "@codebasics"

# -----------------------------------------

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
BOOKMARK_DIR = os.path.join(PROJECT_ROOT, "bookmark", "video", "youtube")


def slugify(text):
    """Turns 'ByteByteGo' or 'System Design Fundamentals' into a kebab-case slug."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)  # Remove punctuation
    slug = re.sub(r"[\s_-]+", "-", slug)  # Replace spaces/underscores with hyphens
    return slug


async def resolve_channel(client, handle, api_key):
    """Resolves a channel @handle to its id, title, and description."""
    params = {
        "part": "snippet",
        "forHandle": handle,
        "key": api_key,
    }
    response = await client.get(f"{YOUTUBE_API_BASE}/channels", params=params)
    response.raise_for_status()
    data = response.json()

    items = data.get("items", [])
    if not items:
        raise ValueError(f"No channel found for handle '{handle}'")

    item = items[0]
    return {
        "id": item["id"],
        "title": item["snippet"]["title"],
        "description": item["snippet"].get("description", ""),
    }


def build_markdown(channel, playlists_with_videos):
    """Formats the channel + its playlists/videos into a bookmark markdown file."""
    lines = ["---", f"title: {channel['title']}", "topics:"]
    for playlist in playlists_with_videos:
        lines.append(f"  - {slugify(playlist['title'])}")
    lines.append("---")
    lines.append("")
    lines.append(f"# {channel['title']}")

    if channel["description"]:
        lines.append("")
        lines.append(channel["description"])

    for playlist in playlists_with_videos:
        lines.append("")
        lines.append(f"## {playlist['title']}")
        for video in playlist["videos"]:
            url = f"https://www.youtube.com/watch?v={video['videoId']}"
            lines.append(f"- [{video['title']}]({url})")

    return "\n".join(lines) + "\n"


async def main():
    if not API_KEY:
        print(f"❌ YOUTUBE_API_KEY not found (checked {ENV_FILE} and environment).")
        return

    async with create_client() as client:
        try:
            channel = await resolve_channel(client, CHANNEL_HANDLE, API_KEY)
        except Exception as e:
            print(f"❌ Error resolving channel '{CHANNEL_HANDLE}': {e}")
            return

        print(f"Found channel: {channel['title']} ({channel['id']})")

        try:
            playlists = await get_all_playlists(client, channel["id"], API_KEY)
        except Exception as e:
            print(f"❌ Error fetching playlists: {e}")
            return

        print(f"Found {len(playlists)} playlist(s). Fetching videos...")

        try:
            videos_per_playlist = await asyncio.gather(
                *(get_all_videos(client, p["playlistId"], API_KEY) for p in playlists)
            )
        except Exception as e:
            print(f"❌ Error fetching videos: {e}")
            return

    playlists_with_videos = [
        {**playlist, "videos": videos}
        for playlist, videos in zip(playlists, videos_per_playlist)
    ]

    markdown_content = build_markdown(channel, playlists_with_videos)

    os.makedirs(BOOKMARK_DIR, exist_ok=True)
    output_path = os.path.join(BOOKMARK_DIR, f"{slugify(channel['title'])}.md")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    total_videos = sum(len(p["videos"]) for p in playlists_with_videos)
    print(f"\n✅ Saved {total_videos} video(s) across {len(playlists)} playlist(s) to '{output_path}'")


if __name__ == "__main__":
    asyncio.run(main())
