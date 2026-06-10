import os
import json
from PIL import Image

def main():
    roster_path = r"c:\Users\rosha\Documents\MLBB\src\data\fallback_roster.json"
    banners_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\banners"
    
    with open(roster_path, 'r', encoding='utf-8') as f:
        roster = json.load(f)
        
    non_transparent = []
    
    for hero in roster:
        hero_id = hero['id']
        name = hero['name']
        banner_filename = f"hero_{hero_id}.webp"
        banner_path = os.path.join(banners_dir, banner_filename)
        
        if not os.path.exists(banner_path):
            print(f"Warning: banner for {name} ({hero_id}) not found at {banner_path}")
            continue
            
        try:
            with Image.open(banner_path) as img:
                has_transparency = False
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    # Check the alpha band
                    alpha = img.split()[-1]
                    min_alpha = alpha.getextrema()[0]
                    if min_alpha < 255:
                        has_transparency = True
                
                if not has_transparency:
                    non_transparent.append((hero_id, name))
        except Exception as e:
            print(f"Error checking banner for {name} ({hero_id}): {e}")
            
    print("\n--- HEROES WITH FULLY OPAQUE BANNERS (NO TRANSPARENCY) ---")
    for hid, name in sorted(non_transparent, key=lambda x: x[0]):
        print(f"ID {hid}: {name}")
        
if __name__ == '__main__':
    main()
