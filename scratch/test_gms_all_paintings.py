import requests
import json

def main():
    url = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    }
    
    try:
        r = requests.post(url, headers=headers, json={"pageSize": 500}, timeout=20)
        if r.status_code == 200:
            data = r.json()
            recs = data.get("data", {}).get("records", [])
            print(f"Total GMS records found: {len(recs)}")
            
            with_paintings = 0
            for i, rec in enumerate(recs[:15]):
                d = rec.get("data", {})
                h_id = d.get("hero_id")
                name = d.get("hero", {}).get("data", {}).get("name")
                painting = d.get("painting")
                if painting:
                    with_paintings += 1
                print(f"Hero {h_id}: {name} -> Painting: {painting}")
                
            # Count total paintings
            total_paintings = sum(1 for rec in recs if rec.get("data", {}).get("painting"))
            print(f"Total heroes with paintings in GMS records: {total_paintings}")
            
        else:
            print("Failed with status:", r.status_code)
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
