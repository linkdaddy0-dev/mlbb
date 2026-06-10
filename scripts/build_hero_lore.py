import json
import os
import re
import requests

def clean_html(text):
    """Strip basic HTML formatting tags to make the story look clean."""
    if not text:
        return ""
    # Strip any tags like <p>, <br>, <font>
    cleaned = re.sub(r'<[^>]*>', '', text)
    # Normalize double spaces and carriage returns
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

def main():
    print("=" * 60)
    print("       MLDRAFT OFFICIAL LORE HARVESTER Sync Run       ")
    print("=" * 60)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "X-Lang": "en",
        "Accept-Language": "en"
    }

    url = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
    print("Fetching base hero records from Moonton GMS CMS...")
    try:
        r = requests.post(url, headers=headers, json={"pageSize": 500}, timeout=25)
        if r.status_code != 200:
            print(f"Error: GMS API returned status code {r.status_code}")
            return
            
        records = r.json().get("data", {}).get("records", [])
        print(f"Successfully retrieved {len(records)} records.")
        
        # Build mapping: HeroName -> Story
        lore_map = {}
        for rec in records:
            d = rec.get("data", {})
            hero_obj = d.get("hero", {})
            hero_data = hero_obj.get("data", {})
            
            name = hero_data.get("name")
            story = hero_data.get("story")
            
            if name and story:
                clean_story = clean_html(story)
                if clean_story:
                    # Map exactly by name (matching App.jsx key indexing)
                    lore_map[name.strip()] = clean_story
                    
        print(f"Successfully compiled lore for {len(lore_map)} heroes.")
        
        # Save output to src/data/hero_lore.json
        out_path = "src/data/hero_lore.json"
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(lore_map, f, indent=2, ensure_ascii=False)
            
        print(f"Saved completed lore mapping to {out_path}!")
        print("=" * 60)
        
    except Exception as e:
        print(f"Scraper error: {e}")

if __name__ == "__main__":
    main()
