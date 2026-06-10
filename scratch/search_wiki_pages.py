import requests

def main():
    url = "https://mobile-legends.fandom.com/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": "Miya",
        "srlimit": 10,
        "format": "json"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code == 200:
            results = r.json().get("query", {}).get("search", [])
            print("Search results:")
            for res in results:
                print(f"- {res.get('title')} (pageid: {res.get('pageid')})")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
