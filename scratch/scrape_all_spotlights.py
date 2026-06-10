import os
import json
import urllib.request
import urllib.parse
import re
import concurrent.futures
import time

roster_path = r'public/data/patches/1.8.84/en/heroes/index.json'
output_path = r'src/data/hero_spotlight_videos.json'

if not os.path.exists(roster_path):
    print("Roster index not found. Run compile first or check path.")
    exit(1)

with open(roster_path, 'r', encoding='utf-8') as f:
    heroes = json.load(f)

print(f"Loaded {len(heroes)} heroes. Preparing to scrape YouTube video IDs...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

video_mapping = {}

# Load existing mapping to avoid re-scraping if running again
if os.path.exists(output_path):
    try:
        with open(output_path, 'r', encoding='utf-8') as f:
            video_mapping = json.load(f)
        print(f"Loaded {len(video_mapping)} existing mappings from {output_path}.")
    except Exception:
        pass

def scrape_hero_video(hero):
    hero_id = str(hero['id'])
    hero_name = hero['name']
    
    if hero_id in video_mapping and video_mapping[hero_id].get('video_id'):
        return hero_id, video_mapping[hero_id]['video_id']
        
    query = f"Mobile Legends {hero_name} Hero Spotlight"
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                html = response.read().decode('utf-8')
            
            video_ids = re.findall(r'"videoId":"([^"]+)"', html)
            if video_ids:
                # Find the first one that looks valid (typically 11 characters)
                for vid in video_ids:
                    if len(vid) == 11:
                        print(f"Scraped {hero_name}: {vid}")
                        return hero_id, vid
            time.sleep(0.5)
        except Exception as e:
            print(f"Error scraping {hero_name} (Attempt {attempt+1}): {e}")
            time.sleep(1)
            
    print(f"Failed to scrape video ID for {hero_name}")
    return hero_id, None

# Run in parallel using a thread pool
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(scrape_hero_video, heroes))

# Assemble mapping
for hero_id, vid in results:
    if vid:
        # We can also map by name for safety
        hero = next(h for h in heroes if str(h['id']) == hero_id)
        video_mapping[hero_id] = {
            "name": hero['name'],
            "video_id": vid,
            "embed_url": f"https://www.youtube.com/embed/{vid}",
            "search_url": f"https://www.youtube.com/results?search_query=MLBB+{urllib.parse.quote(hero['name'])}+Guide"
        }

# Write mapping
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(video_mapping, f, indent=2)

print(f"Scrape complete. Saved {len(video_mapping)} hero video mappings to {output_path}.")
