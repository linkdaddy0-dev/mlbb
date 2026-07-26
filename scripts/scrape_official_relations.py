import requests
import json
import os
import sys

def main():
    """Returns 0 on success, 1 on failure so CI can stop instead of publishing stale data."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    }

    url = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
    print("Fetching base hero records for relations...")
    try:
        r = requests.post(url, headers=headers, json={"pageSize": 500}, timeout=20)
        if r.status_code == 200:
            records = r.json().get("data", {}).get("records", [])
            print(f"Success! Got {len(records)} records.")
            
            relations = {}
            for rec in records:
                d = rec.get("data", {})
                h_id = d.get("hero_id")
                
                # Fetch name
                hero_obj = d.get("hero", {})
                hero_data = hero_obj.get("data", {})
                hero_name = hero_data.get("name")
                
                if h_id is None or not hero_name:
                    continue
                    
                rel = d.get("relation", {})
                relations[str(h_id)] = {
                    "name": hero_name,
                    "synergy_desc": rel.get("assist", {}).get("desc", ""),
                    "strong_desc": rel.get("strong", {}).get("desc", ""),
                    "weak_desc": rel.get("weak", {}).get("desc", "")
                }
                
            os.makedirs("data", exist_ok=True)
            if not relations:
                print("Upstream returned records but none were usable — refusing to overwrite the existing file.")
                return 1

            with open("data/official_relations.json", "w", encoding="utf-8") as f:
                json.dump(relations, f, indent=2)
            print(f"Saved {len(relations)} relations to data/official_relations.json")
            return 0
        else:
            print(f"Failed with status: {r.status_code}")
            return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
