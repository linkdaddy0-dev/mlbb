"""Fetch official Moonton hero list and save avatar URL mapping."""

import json
import os
import urllib.request

API_URL = "https://mapi.mobilelegends.com/hero/list"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "avatar_map.json")


def fetch_hero_list():
    """Fetch the hero list JSON from the Moonton API."""
    req = urllib.request.Request(API_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_avatar_map(data):
    """Extract heroid -> normalized avatar URL mapping."""
    avatar_map = {}
    for hero in data:
        heroid = str(hero["heroid"])
        url = hero["key"]
        # Normalize protocol-relative URLs
        if url.startswith("//"):
            url = "https:" + url
        avatar_map[heroid] = url
    return avatar_map


def main():
    print("Fetching hero list from Moonton API...")
    response = fetch_hero_list()

    if response.get("code") != 2000:
        raise RuntimeError(f"API error: {response.get('message', 'Unknown error')}")

    heroes = response["data"]
    avatar_map = build_avatar_map(heroes)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PATH)), exist_ok=True)

    with open(os.path.abspath(OUTPUT_PATH), "w", encoding="utf-8") as f:
        json.dump(avatar_map, f, indent=2, ensure_ascii=False)

    print(f"Success! Saved {len(avatar_map)} hero avatar mappings to {os.path.abspath(OUTPUT_PATH)}")


if __name__ == "__main__":
    main()
