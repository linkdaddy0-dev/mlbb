import os
import json
from PIL import Image

def main():
    roster_path = r"c:\Users\rosha\Documents\MLBB\src\data\fallback_roster.json"
    paintings_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\paintings"
    
    with open(roster_path, 'r', encoding='utf-8') as f:
        roster = json.load(f)
        
    missing_paintings = []
    opaque_paintings = []
    transparent_paintings = []
    
    for hero in roster:
        hero_id = hero['id']
        name = hero['name']
        painting_filename = f"hero_{hero_id}.webp"
        painting_path = os.path.join(paintings_dir, painting_filename)
        
        if not os.path.exists(painting_path):
            missing_paintings.append((hero_id, name))
            continue
            
        try:
            with Image.open(painting_path) as img:
                has_transparency = False
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    alpha = img.split()[-1]
                    min_alpha = alpha.getextrema()[0]
                    if min_alpha < 255:
                        has_transparency = True
                
                if has_transparency:
                    transparent_paintings.append((hero_id, name))
                else:
                    opaque_paintings.append((hero_id, name))
        except Exception as e:
            print(f"Error checking painting for {name} ({hero_id}): {e}")
            
    print(f"\nTotal heroes checked: {len(roster)}")
    print(f"Has transparent painting: {len(transparent_paintings)}")
    print(f"Has opaque painting: {len(opaque_paintings)}")
    print(f"Missing painting file: {len(missing_paintings)}")
    
    print("\n--- MISSING PAINTING FILES ---")
    for hid, name in sorted(missing_paintings, key=lambda x: x[0]):
        print(f"ID {hid}: {name}")
        
    print("\n--- OPAQUE (NON-TRANSPARENT) PAINTING FILES ---")
    for hid, name in sorted(opaque_paintings, key=lambda x: x[0]):
        print(f"ID {hid}: {name}")
        
    print("\n--- TRANSPARENT PAINTING FILES ---")
    for hid, name in sorted(transparent_paintings, key=lambda x: x[0]):
        print(f"ID {hid}: {name}")

if __name__ == '__main__':
    main()
