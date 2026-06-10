import os
import json
from PIL import Image

def main():
    roster_path = r"c:\Users\rosha\Documents\MLBB\src\data\fallback_roster.json"
    
    with open(roster_path, 'r', encoding='utf-8') as f:
        roster = json.load(f)
        
    has_t = []
    no_t = []
    
    for h in roster:
        hid = h['id']
        name = h['name']
        banner_path = f"public/assets/banners/hero_{hid}_transparent.webp"
        painting_path = f"public/assets/paintings/hero_{hid}.webp"
        
        is_t = False
        # Check banner first
        if os.path.exists(banner_path):
            is_t = True
        # Check painting next
        elif os.path.exists(painting_path):
            try:
                with Image.open(painting_path) as img:
                    if img.mode == 'RGBA':
                        alpha = img.split()[-1]
                        if alpha.getextrema()[0] < 255:
                            is_t = True
            except Exception as e:
                pass
                
        if is_t:
            has_t.append((hid, name))
        else:
            no_t.append((hid, name))
            
    print(f"Total Transparent: {len(has_t)}")
    print(f"Total Opaque: {len(no_t)}")
    
    print("\n--- HEROES WITHOUT ANY TRANSPARENT IMAGE ---")
    for hid, name in sorted(no_t, key=lambda x: x[0]):
        print(f"ID {hid}: {name}")

if __name__ == '__main__':
    main()
