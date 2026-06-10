import requests
import json

def search_urls(val, path='', found=[]):
    if isinstance(val, dict):
        for k, v in val.items():
            search_urls(v, path + '.' + k if path else k, found)
    elif isinstance(val, list):
        for i, v in enumerate(val):
            search_urls(v, f'{path}[{i}]', found)
    elif isinstance(val, str):
        if ('youngjoygame.com' in val or 'mobilelegends.com' in val) and ('.webp' in val or '.png' in val or '.jpg' in val):
            found.append((path, val))

def main():
    gms_url = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    }
    
    print("Fetching GMS API records...")
    r = requests.post(gms_url, headers=headers, json={"pageSize": 500}, timeout=25)
    if r.status_code != 200:
        print(f"Error: status {r.status_code}")
        return
        
    records = r.json().get("data", {}).get("records", [])
    print(f"Fetched {len(records)} records.")
    
    for idx, rec in enumerate(records):
        hero_id = rec.get("data", {}).get("hero_id")
        hero_name = rec.get("data", {}).get("hero", {}).get("data", {}).get("name", "Unknown")
        
        found = []
        search_urls(rec, '', found)
        
        print(f"\n[{idx+1}] Hero ID: {hero_id} ({hero_name})")
        # Print all found image URLs
        for path_str, url in found:
            # Let's print only paths containing painting or image, or anything useful
            if 'head' in path_str.lower() or 'painting' in path_str.lower() or 'cover' in path_str.lower():
                print(f"  - {path_str}: {url}")

if __name__ == "__main__":
    main()
