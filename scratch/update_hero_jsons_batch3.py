import os
import json

hero_ids = [38, 43, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 108, 109, 111, 112, 114, 115, 116, 117, 118, 122]

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
                
            data["cover_transparent"] = f"/assets/banners/hero_{hid}_transparent.webp"
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, separators=(',', ':'))
                
            print(f"[OK] Updated Hero {hid} JSON.")
            updated_count += 1
        except Exception as e:
            print(f"[ERROR] Failed to update Hero {hid} JSON: {e}")
            
    print(f"\nCompleted updating JSONs. Updated: {updated_count}, Not Found: {not_found_count}")

if __name__ == '__main__':
    main()
