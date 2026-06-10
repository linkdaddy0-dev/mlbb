import requests

def main():
    url = "https://mobile-legends.fandom.com/api.php"
    params = {
        "action": "query",
        "list": "allimages",
        "aiprefix": "Miya",
        "ailimit": 50,
        "format": "json"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code == 200:
            data = r.json()
            images = data.get("query", {}).get("allimages", [])
            print(f"Found {len(images)} images matching prefix 'Miya':")
            for img in images:
                name = img.get("name")
                url_src = img.get("url")
                print(f"- {name}: {url_src}")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
