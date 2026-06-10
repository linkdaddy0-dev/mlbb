import os
import json
import requests
from PIL import Image
from io import BytesIO

def check_transparency(path):
    if not os.path.exists(path):
        return False
    try:
        with Image.open(path) as img:
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                alpha = img.split()[-1]
                min_alpha = alpha.getextrema()[0]
                return min_alpha < 255
    except:
        pass
    return False

def get_wiki_images(hero_names):
    url = "https://mobile-legends.fandom.com/api.php"
    # Fandom API allows querying multiple titles joined by '|'
    titles_str = "|".join(hero_names)
    params = {
        "action": "query",
        "prop": "pageimages",
        "titles": titles_str,
        "pithumbsize": 1200, # Large thumb size to get high-quality images
        "format": "json"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=25)
        if r.status_code == 200:
            data = r.json()
            pages = data.get("query", {}).get("pages", {})
            results = {}
            for page_id, page_info in pages.items():
                title = page_info.get("title")
                thumbnail = page_info.get("thumbnail", {})
                source = thumbnail.get("source")
                if source:
                    # Clean the URL to get the original high-resolution transparent image
                    clean_source = source.split('/revision/')[0]
                    results[title.lower()] = clean_source
            return results
    except Exception as e:
        print(f"Error querying Fandom API for {hero_names[:3]}... : {e}")
    return {}

def download_and_convert_to_webp(url, dest_path):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 200:
            # Load the image
            img = Image.open(BytesIO(r.content))
            
            # Ensure it is saved with transparency (convert to RGBA)
            if img.mode != "RGBA":
                img = img.convert("RGBA")
                
            # Save as WebP
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            img.save(dest_path, "WEBP", quality=75)
            return True
        else:
            print(f"Failed to download image from {url}: HTTP {r.status_code}")
    except Exception as e:
        print(f"Error downloading/converting image from {url}: {e}")
    return False

def main():
    roster_path = r"c:\Users\rosha\Documents\MLBB\src\data\fallback_roster.json"
    paintings_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\paintings"
    
    with open(roster_path, 'r', encoding='utf-8') as f:
        roster = json.load(f)
        
    # Find all heroes that do NOT currently have transparent paintings
    target_heroes = []
    for hero in roster:
        hero_id = hero['id']
        name = hero['name']
        painting_path = os.path.join(paintings_dir, f"hero_{hero_id}.webp")
        
        # Check if already transparent
        if not check_transparency(painting_path):
            target_heroes.append(hero)
            
    print(f"Total heroes to scrape transparent paintings for: {len(target_heroes)}")
    
    # Process in batches of 40 to satisfy Fandom API title limits
    batch_size = 40
    all_mappings = {}
    
    for i in range(0, len(target_heroes), batch_size):
        batch = target_heroes[i:i+batch_size]
        batch_names = [h['name'] for h in batch]
        print(f"\nQuerying batch {i//batch_size + 1}... ({len(batch_names)} heroes)")
        
        batch_results = get_wiki_images(batch_names)
        all_mappings.update(batch_results)
        
    # Download and replace the paintings
    downloaded_count = 0
    failed_count = 0
    
    print("\nStarting download and conversion to WebP...")
    for hero in target_heroes:
        hero_id = hero['id']
        name = hero['name']
        dest_path = os.path.join(paintings_dir, f"hero_{hero_id}.webp")
        
        # Look up URL from the mapping (by lowercased name)
        url = all_mappings.get(name.lower())
        if not url:
            print(f"Could not find transparent image URL for {name} (ID {hero_id}) in Wikia API results.")
            failed_count += 1
            continue
            
        print(f"Downloading transparent image for {name} ({hero_id}) from: {url}")
        success = download_and_convert_to_webp(url, dest_path)
        if success:
            downloaded_count += 1
            print(f"Successfully saved transparent painting: {dest_path}")
        else:
            failed_count += 1
            
    print("\n--- SCRAPING COMPLETED ---")
    print(f"Successfully updated transparent paintings: {downloaded_count}")
    print(f"Failed / Missing: {failed_count}")

if __name__ == '__main__':
    main()
