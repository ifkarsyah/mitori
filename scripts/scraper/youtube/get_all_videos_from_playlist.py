import asyncio
from urllib.parse import urlparse, parse_qs

from common import API_KEY, ENV_FILE, YOUTUBE_API_BASE, create_client

# --- CONFIGURATION: SET THE TARGET PLAYLIST HERE ---
PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLCRMIe5FDPse83estfxg_d6bF5ALh77Yq"


def extract_playlist_id(url_or_id):
    """Accepts either a full playlist URL or a bare playlist ID and returns the ID."""
    if "youtube.com" not in url_or_id and "youtu.be" not in url_or_id:
        return url_or_id

    query = parse_qs(urlparse(url_or_id).query)
    playlist_id = query.get("list", [None])[0]
    if not playlist_id:
        raise ValueError(f"Could not find a 'list' parameter in '{url_or_id}'")

    return playlist_id


async def get_all_videos(client, playlist_id, api_key):
    """Fetches every video belonging to a playlist, following pagination."""
    videos = []
    page_token = None

    while True:
        params = {
            "part": "snippet",
            "playlistId": playlist_id,
            "maxResults": 50,
            "key": api_key,
        }
        if page_token:
            params["pageToken"] = page_token

        response = await client.get(f"{YOUTUBE_API_BASE}/playlistItems", params=params)
        response.raise_for_status()
        data = response.json()

        for item in data.get("items", []):
            snippet = item["snippet"]
            video_id = snippet.get("resourceId", {}).get("videoId")
            if not video_id:
                continue
            videos.append(
                {
                    "title": snippet["title"],
                    "videoId": video_id,
                }
            )

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return videos


async def main():
    if not API_KEY:
        print(f"❌ YOUTUBE_API_KEY not found (checked {ENV_FILE} and environment).")
        return

    try:
        playlist_id = extract_playlist_id(PLAYLIST_URL)
    except Exception as e:
        print(f"❌ Error parsing playlist URL '{PLAYLIST_URL}': {e}")
        return

    print(f"Playlist ID: {playlist_id}")

    async with create_client() as client:
        try:
            videos = await get_all_videos(client, playlist_id, API_KEY)
        except Exception as e:
            print(f"❌ Error fetching videos: {e}")
            return

    print(f"\nFound {len(videos)} video(s) in playlist:\n")
    for video in videos:
        url = f"https://www.youtube.com/watch?v={video['videoId']}"
        print(f"- {video['title']}\n  {url}")


if __name__ == "__main__":
    asyncio.run(main())
