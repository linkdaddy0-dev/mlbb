import os
import json
import requests
import time
from PIL import Image
from io import BytesIO

# Target directories
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAINTINGS_DIR = os.path.join(ROOT_DIR, "public", "assets", "paintings")
HERO_MAP_PATH = os.path.join(ROOT_DIR, "scratch", "gms_hero_map.json")
META_STATS_PATH = os.path.join(ROOT_DIR, "src", "data", "hero_meta_stats.json")

def main():
    print("=" * 60)
    print("        COLLECTING TRANSPARENT HERO PAINTINGS SOURCE RUN        ")
    print("=" * 60)

    # Ensure target directory exists
    os.makedirs(PAINTINGS_DIR, exist_ok=True)

    # 1. Load hero map (ID -> Name)
    if not os.path.exists(HERO_MAP_PATH):
        print(f"Error: Hero map not found at {HERO_MAP_PATH}")
        return
    with open(HERO_MAP_PATH, "r", encoding="utf-8") as f:
        hero_map = json.load(f)
    print(f"Loaded {len(hero_map)} heroes from map.")

    # 2. Query GMS API for hero painting overrides
    gms_paintings = {}
    print("Querying GMS API for hero paintings...")
    gms_url = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    }
    try:
        r = requests.post(gms_url, headers=headers, json={"pageSize": 500}, timeout=25)
        if r.status_code == 200:
            records = r.json().get("data", {}).get("records", [])
            for rec in records:
                d = rec.get("data", {})
                h_id = d.get("hero_id")
                painting_url = d.get("painting")
                if h_id is not None and painting_url:
                    gms_paintings[str(h_id)] = painting_url
            print(f"Found {len(gms_paintings)} paintings in GMS API.")
        else:
            print(f"GMS API request failed with status: {r.status_code}")
    except Exception as e:
        print(f"Error querying GMS API: {e}")

    # 3. Load fallback hero meta stats (Name -> URL)
    meta_stats = []
    if os.path.exists(META_STATS_PATH):
        with open(META_STATS_PATH, "r", encoding="utf-8") as f:
            meta_stats = json.load(f)
    name_to_meta = {m.get("name", "").lower().strip(): m for m in meta_stats if m.get("name")}
    print(f"Loaded {len(name_to_meta)} hero meta profiles.")

    # Create mapping of ID -> target download URL
    download_targets = {}
    for h_id_str, h_name in hero_map.items():
        h_id = int(h_id_str)
        # Try GMS first
        url = gms_paintings.get(h_id_str)
        source = "GMS API"
        
        # Try meta stats next
        if not url:
            meta = name_to_meta.get(h_name.lower().strip())
            if meta:
                url = meta.get("cover_thumb") or meta.get("avatar_url")
                source = "hero_meta_stats.json"

        # Fallback to Miya's GMS painting if completely missing
        if not url:
            url = "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_cef8ef47912cced083381c9cf86f35cb.png"
            source = "Default Fallback"

        download_targets[h_id] = (h_name, url, source)

    print("\nStarting downloads...")
    print("-" * 60)

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })

    success_count = 0
    failure_count = 0

    for h_id in sorted(download_targets.keys()):
        h_name, url, source = download_targets[h_id]
        dest_filename = f"hero_{h_id}.webp"
        dest_path = os.path.join(PAINTINGS_DIR, dest_filename)

        # Check if already exists and is non-empty
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
            print(f"[{h_id}/132] {h_name} already exists. Skipping.")
            success_count += 1
            continue

        print(f"[{h_id}/132] Downloading {h_name} from {source}...")
        try:
            time.sleep(0.1) # Small throttle
            resp = session.get(url, timeout=15)
            if resp.status_code == 200:
                # Open with Pillow, convert, and save as WebP
                img = Image.open(BytesIO(resp.content))
                img = img.convert("RGBA")
                img.save(dest_path, "WEBP", quality=85)
                print(f"      [OK] Successfully saved to {dest_filename}")
                success_count += 1
            else:
                print(f"      [ERROR] HTTP error: {resp.status_code}")
                failure_count += 1
        except Exception as e:
            print(f"      [ERROR] Request failed: {e}")
            failure_count += 1

    print("-" * 60)
    print("DOWNLOAD RUN SUMMARY:")
    print(f"  - Successfully processed/verified: {success_count} heroes.")
    print(f"  - Failed:                           {failure_count} heroes.")
    print("=" * 60)

if __name__ == "__main__":
    main()
