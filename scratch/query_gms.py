import requests
import json

url = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json"
}

r = requests.post(url, headers=headers, json={"pageSize": 500})
if r.status_code == 200:
    try:
        data = r.json()
        recs = data.get("data", {}).get("records", [])
        results = []
        for rec in recs:
            d = rec.get("data", {})
            h_id = d.get("hero_id")
            if h_id in [127, 128, 129, 130, 131, 132]:
                results.append({
                    "hero_id": h_id,
                    "name": d.get("hero", {}).get("data", {}).get("name"),
                    "head": d.get("head"),
                    "head_big": d.get("head_big"),
                    "painting": d.get("painting")
                })
        print(json.dumps(results, indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)
        print("Response text:", r.text[:500])
else:
    print("Failed with status:", r.status_code)
