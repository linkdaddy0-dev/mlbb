"""
Download transparent hero paintings from the official Moonton GMS API.

Prioritizes the top-level `data.painting` field which contains RGBA transparent
images hosted on akmweb.youngjoygame.com/web/gms/image/*.webp

Falls back to the nested `data.hero.data.painting` field (homepage PNGs) if
the top-level painting is empty.
"""

import os
import sys
import json
import requests
import time
from PIL import Image
from io import BytesIO

# Force UTF-8 output on Windows to avoid cp1252 encoding errors
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Target directories
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAINTINGS_DIR = os.path.join(ROOT_DIR, "public", "assets", "paintings")
HERO_MAP_PATH = os.path.join(ROOT_DIR, "scratch", "gms_hero_map.json")

GMS_API_URL = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json"
}


def query_gms_api():
    """Query the GMS API and return a dict of hero_id -> {painting_url, source, name}."""
    print("Querying GMS API for hero paintings...")
    
    try:
        r = requests.post(GMS_API_URL, headers=HEADERS, json={"pageSize": 500}, timeout=30)
        if r.status_code != 200:
            print(f"  [ERROR] GMS API returned status {r.status_code}")
            return {}
        
        records = r.json().get("data", {}).get("records", [])
        print(f"  Found {len(records)} records in GMS API.")
        
        hero_paintings = {}
        
        for rec in records:
            d = rec.get("data", {})
            hero_id = d.get("hero_id")
            if hero_id is None:
                continue
            
            hero_name = "Unknown"
            hero_data = d.get("hero", {})
            if isinstance(hero_data, dict):
                nested = hero_data.get("data", {})
                if isinstance(nested, dict):
                    hero_name = nested.get("name", "Unknown")
            
            # Priority 1: Top-level painting (transparent webp from gms/image/)
            top_level_painting = d.get("painting", "")
            
            # Priority 2: Nested hero painting (homepage PNG)
            nested_painting = ""
            if isinstance(hero_data, dict):
                nested = hero_data.get("data", {})
                if isinstance(nested, dict):
                    nested_painting = nested.get("painting", "")
            
            # Priority 3: head_big (JPG fallback)
            head_big = d.get("head_big", "")
            
            if top_level_painting:
                url = top_level_painting
                source = "GMS top-level painting (transparent)"
            elif nested_painting:
                url = nested_painting
                source = "GMS hero.data.painting (homepage)"
            elif head_big:
                url = head_big
                source = "GMS head_big (fallback)"
            else:
                url = None
                source = "NO URL FOUND"
            
            hero_paintings[str(hero_id)] = {
                "name": hero_name,
                "url": url,
                "source": source
            }
        
        return hero_paintings
    
    except Exception as e:
        print(f"  [ERROR] GMS API query failed: {e}")
        return {}


def download_painting(session, hero_id, info, force=False):
    """Download a single hero painting and save as RGBA WEBP."""
    dest_filename = f"hero_{hero_id}.webp"
    dest_path = os.path.join(PAINTINGS_DIR, dest_filename)
    
    url = info.get("url")
    name = info.get("name", "Unknown")
    source = info.get("source", "Unknown")
    
    if not url:
        print(f"  [{hero_id}] {name}: NO URL available - SKIPPED")
        return False
    
    # Skip if already exists and not forcing
    if not force and os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        # Check if current file is from official source (transparent)
        # We force re-download to ensure we have the transparent version
        pass  # We'll always re-download to get official transparent images
    
    print(f"  [{hero_id}] {name}: Downloading from {source}...")
    print(f"         URL: {url[:80]}...")
    
    try:
        time.sleep(0.15)  # Throttle
        resp = session.get(url, timeout=20)
        
        if resp.status_code != 200:
            print(f"         [ERROR] HTTP {resp.status_code}")
            return False
        
        # Open with Pillow, preserve/convert to RGBA for transparency
        img = Image.open(BytesIO(resp.content))
        original_mode = img.mode
        
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        
        img.save(dest_path, "WEBP", quality=90, lossless=False)
        
        file_size = os.path.getsize(dest_path)
        is_transparent = original_mode == "RGBA" or "gms/image" in url
        transparency_status = "[TRANSPARENT]" if is_transparent else "[opaque]"
        
        print(f"         [OK] {file_size/1024:.1f}KB | {img.size[0]}x{img.size[1]} | {original_mode} -> RGBA | {transparency_status}")
        return True
    
    except Exception as e:
        print(f"         [ERROR] {e}")
        return False


def main():
    print("=" * 70)
    print("    OFFICIAL TRANSPARENT HERO PAINTINGS DOWNLOADER")
    print("    Source: Moonton GMS API (akmweb.youngjoygame.com)")
    print("=" * 70)
    
    os.makedirs(PAINTINGS_DIR, exist_ok=True)
    
    # 1. Query GMS API for all hero paintings
    hero_paintings = query_gms_api()
    
    if not hero_paintings:
        print("\n[FATAL] No hero paintings found. Aborting.")
        return
    
    # Count sources
    source_counts = {}
    for info in hero_paintings.values():
        src = info["source"]
        source_counts[src] = source_counts.get(src, 0) + 1
    
    print(f"\nFound {len(hero_paintings)} heroes with painting data:")
    for src, count in sorted(source_counts.items()):
        print(f"  - {src}: {count} heroes")
    
    # 2. Download all paintings
    print("\n" + "-" * 70)
    print("DOWNLOADING PAINTINGS...")
    print("-" * 70)
    
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    
    success = 0
    failed = 0
    skipped = 0
    
    for hero_id in sorted(hero_paintings.keys(), key=lambda x: int(x)):
        info = hero_paintings[hero_id]
        
        if download_painting(session, hero_id, info, force=True):
            success += 1
        else:
            if info.get("url"):
                failed += 1
            else:
                skipped += 1
    
    # 3. Summary
    print("\n" + "=" * 70)
    print("DOWNLOAD SUMMARY")
    print(f"  [OK] Successfully downloaded: {success}")
    print(f"  [FAIL] Failed:                {failed}")
    print(f"  [SKIP] Skipped (no URL):      {skipped}")
    print(f"  Total heroes:                 {len(hero_paintings)}")
    print("=" * 70)
    
    # 4. Verify transparency of downloaded files
    print("\nVerifying transparency of downloaded paintings...")
    transparent_count = 0
    opaque_count = 0
    
    for hero_id in sorted(hero_paintings.keys(), key=lambda x: int(x)):
        path = os.path.join(PAINTINGS_DIR, f"hero_{hero_id}.webp")
        if os.path.exists(path):
            try:
                img = Image.open(path)
                if img.mode == "RGBA":
                    # Check if any pixel actually has transparency
                    alpha = img.split()[-1]
                    min_alpha = alpha.getextrema()[0]
                    if min_alpha < 255:
                        transparent_count += 1
                    else:
                        opaque_count += 1
                else:
                    opaque_count += 1
            except:
                pass
    
    print(f"  [TRANSPARENT] Truly transparent (RGBA with alpha < 255): {transparent_count}")
    print(f"  [OPAQUE] No actual transparency:                        {opaque_count}")
    print("=" * 70)


if __name__ == "__main__":
    main()
