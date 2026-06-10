import requests
import json

def find_urls(val, path='', found=[]):
    if isinstance(val, dict):
        for k, v in val.items():
            find_urls(v, f"{path}.{k}" if path else k, found)
    elif isinstance(val, list):
        for i, v in enumerate(val):
            find_urls(v, f"{path}[{i}]", found)
    elif isinstance(val, str):
        if any(ext in val.lower() for ext in ['.webp', '.png', '.jpg', '.jpeg']):
            found.append((path, val))

def main():
    url = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    }
    r = requests.post(url, headers=headers, json={"pageSize": 500}, timeout=25)
    records = r.json().get("data", {}).get("records", [])
    
    target_ids = [127, 128, 129, 132]
    for rec in records:
        # Check if hero_id is in target_ids (could be at rec.data.hero_id, or elsewhere)
        # Let's search recursively for hero_id or check if it matches in the record
        hero_id = None
        # Try to find hero_id at any level
        def find_hero_id(d):
            if isinstance(d, dict):
                if 'hero_id' in d:
                    return d['hero_id']
                for v in d.values():
                    res = find_hero_id(v)
                    if res is not None:
                        return res
            elif isinstance(d, list):
                for v in d:
                    res = find_hero_id(v)
                    if res is not None:
                        return res
            return None
            
        hero_id = find_hero_id(rec)
        if hero_id in target_ids:
            name = ""
            def find_name(d):
                if isinstance(d, dict):
                    if 'name' in d and isinstance(d['name'], str) and d['name'] in ['Lukas', 'Kalea', 'Zetian', 'Marcel']:
                        return d['name']
                    for v in d.values():
                        res = find_name(v)
                        if res is not None:
                            return res
                elif isinstance(d, list):
                    for v in d:
                        res = find_name(v)
                        if res is not None:
                            return res
                return None
            name = find_name(rec) or "Unknown"
            
            print(f"\n================= ID: {hero_id} ({name}) =================")
            found = []
            find_urls(rec, '', found)
            for path, url_val in found:
                # Filter for main images like cover, head, painting, gallery
                if any(k in path.lower() for k in ['cover', 'painting', 'gallery', 'head', 'icon']):
                    print(f"  {path}: {url_val}")

if __name__ == '__main__':
    main()
