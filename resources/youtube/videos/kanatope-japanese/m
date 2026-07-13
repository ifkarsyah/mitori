import os
import sys
from slugify import slugify
from yt_dlp import YoutubeDL

def create_markdown_from_youtube(video_url: str):
    # Options for yt-dlp to only fetch metadata without downloading the video
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
    }
    
    print("Fetching video metadata from YouTube...")
    try:
        with YoutubeDL(ydl_opts) as ydl:
            # Extract the info dictionary from the URL
            info = ydl.extract_info(video_url, download=False)
            
            # Pull the required fields
            title = info.get('title', 'Unknown Title')
            channel = info.get('uploader', 'Unknown Channel')
            
            # Build the Markdown content template
            markdown_content = f"""---
title: {title}
url: {video_url}
category: listening
channel: {slugify(channel)}
---

# {title}
"""
            
            # Generate the safe filename: e.g., "japanese-listening-practice-changing-trains-at-shinjuku-station.md"
            filename = f"{slugify(title)}.md"
            
            # Save the file
            with open(filename, "w", encoding="utf-8") as f:
                f.write(markdown_content)
                
            print(f"Successfully created: {filename}")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Check if a URL argument was passed
    if len(sys.argv) < 2:
        print("Error: Please provide a YouTube URL.")
        print("Usage: python script.py <YOUTUBE_URL>")
        sys.exit(1)
        
    # Grab the first argument after the script name
    url = sys.argv[1]
    create_markdown_from_youtube(url)