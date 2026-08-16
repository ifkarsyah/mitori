"""Shared helpers for the youtube scraper scripts in this folder."""

import os

# Third-party libraries managed by uv
import httpx

# API key is read from a .env file next to this module, e.g.:
#   YOUTUBE_API_KEY=your-key-here
ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

DEFAULT_TIMEOUT = 10


def load_env_file(path):
    """Minimal .env parser: sets os.environ from KEY=VALUE lines."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


load_env_file(ENV_FILE)
API_KEY = os.environ.get("YOUTUBE_API_KEY")


def create_client():
    """Returns a preconfigured async HTTP client for calling the YouTube API."""
    return httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)
