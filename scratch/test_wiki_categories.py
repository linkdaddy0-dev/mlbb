import requests

def main():
    url = "https://mobile-legends.fandom.com/api.php"
    
    # 1. Test listing members of Category:Hero Renders or similar
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:Hero Renders",
        "cmlimit": 50,
        "format": "json"
    }
    
    # Let's also check Categories for Miya page
    params2 = {
        "action": "query",
        "prop": "categories",
        "titles": "Miya",
        "cllimit": 50,
        "format": "json"
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    
    try:
        r2 = requests.get(url, params=params2, headers=headers, timeout=15)
        if r2.status_code == 200:
            pages = r2.json().get("query", {}).get("pages", {})
            for pid, page in pages.items():
                print(f"Categories for Miya:")
                for cat in page.get("categories", []):
                    print(f"- {cat.get('title')}")
                    
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code == 200:
            members = r.json().get("query", {}).get("categorymembers", [])
            print(f"\nMembers of Category:Hero Renders:")
            for m in members:
                print(f"- {m.get('title')}")
                
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
