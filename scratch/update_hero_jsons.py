import os
import json

hero_ids = [1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 16, 17, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 32]

def main():
    heroes_dir = r"c:\Users\rosha\Documents\MLBB\public\data\patches\1.8.84\en\heroes"
    
    updated_count = 0
    not_found_count = 0
    
    for hid in hero_ids:
        json_path = os.path.join(heroes_dir, f"{hid}.json")
        if not os.path.exists(json_path):
            print(f"[WARNING] JSON file for Hero {hid} not found at: {json_path}")
            not_found_count += 1
            continue
            
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Add or update cover_transparent
            data["cover_transparent"] = f"/assets/banners/hero_{hid}_transparent.webp"
            
            # Write back (minified/regular format)
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, separators=(',', ':'))
                
            print(f"[OK] Updated Hero {hid} JSON.")
            updated_count += 1
        except Exception as e:
            print(f"[ERROR] Failed to update Hero {hid} JSON: {e}")
            
    print(f"\nCompleted updating JSONs. Updated: {updated_count}, Not Found: {not_found_count}")

if __name__ == '__main__':
    main()
