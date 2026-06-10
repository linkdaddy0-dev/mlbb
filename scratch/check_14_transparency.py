import os
import json
from PIL import Image

def analyze_image(path):
    if not os.path.exists(path):
        return "Missing"
    try:
        with Image.open(path) as img:
            mode = img.mode
            if mode in ('RGBA', 'LA'):
                alpha = img.split()[-1]
                min_alpha, max_alpha = alpha.getextrema()
                if min_alpha < 255:
                    return f"{mode} (Transparent, min alpha: {min_alpha})"
                else:
                    return f"{mode} (Fully Opaque)"
            else:
                return f"{mode} (No Alpha Channel)"
    except Exception as e:
        return f"Error: {e}"

def main():
    transparent_ids = [119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132]
    
    # Load roster for names
    roster_path = r"c:\Users\rosha\Documents\MLBB\src\data\fallback_roster.json"
    with open(roster_path, 'r', encoding='utf-8') as f:
        roster = json.load(f)
        
    names = {h['id']: h['name'] for h in roster}
    
    print(f"{'ID':<4} | {'Name':<15} | {'Banner Status':<40} | {'Painting Status':<40}")
    print("-" * 110)
    for hid in transparent_ids:
        name = names.get(hid, "Unknown")
        banner_path = f"public/assets/banners/hero_{hid}.webp"
        painting_path = f"public/assets/paintings/hero_{hid}.webp"
        
        banner_status = analyze_image(banner_path)
        painting_status = analyze_image(painting_path)
        
        print(f"{hid:<4} | {name:<15} | {banner_status:<40} | {painting_status:<40}")

if __name__ == '__main__':
    main()
