import asyncio

from common import API_KEY, ENV_FILE, YOUTUBE_API_BASE, create_client

# --- CONFIGURATION: SET THE TARGET CHANNEL HERE ---
CHANNEL_HANDLE = "@ByteByteGo"


async def resolve_channel_id(client, handle, api_key):
    """Resolves a channel @handle (e.g. '@mkbhd') to its channel ID."""
    params = {
        "part": "id",
        "forHandle": handle,
        "key": api_key,
    }
    response = await client.get(f"{YOUTUBE_API_BASE}/channels", params=params)
    response.raise_for_status()
    data = response.json()

    items = data.get("items", [])
    if not items:
        raise ValueError(f"No channel found for handle '{handle}'")

    return items[0]["id"]


async def get_all_playlists(client, channel_id, api_key):
    """Fetches every playlist belonging to a channel, following pagination."""
    playlists = []
    page_token = None

    while True:
        params = {
            "part": "snippet",
            "channelId": channel_id,
            "maxResults": 50,
            "key": api_key,
        }
        if page_token:
            params["pageToken"] = page_token

        response = await client.get(f"{YOUTUBE_API_BASE}/playlists", params=params)
        response.raise_for_status()
        data = response.json()

        for item in data.get("items", []):
            playlists.append(
                {
                    "title": item["snippet"]["title"],
                    "playlistId": item["id"],
                }
            )

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return playlists


async def main():
    if not API_KEY:
        print(f"❌ YOUTUBE_API_KEY not found (checked {ENV_FILE} and environment).")
        return

    async with create_client() as client:
        try:
            channel_id = await resolve_channel_id(client, CHANNEL_HANDLE, API_KEY)
        except Exception as e:
            print(f"❌ Error resolving channel '{CHANNEL_HANDLE}': {e}")
            return

        print(f"Found channel ID: {channel_id}")

        try:
            playlists = await get_all_playlists(client, channel_id, API_KEY)
        except Exception as e:
            print(f"❌ Error fetching playlists: {e}")
            return

    print(f"\nFound {len(playlists)} playlist(s) for {CHANNEL_HANDLE}:\n")
    for playlist in playlists:
        url = f"https://www.youtube.com/playlist?list={playlist['playlistId']}"
        print(f"- {playlist['title']}\n  {url}")


if __name__ == "__main__":
    asyncio.run(main())
