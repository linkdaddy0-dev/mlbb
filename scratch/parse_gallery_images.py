import requests
import json

def main():
    # Fetch all images on the page "Miya/Gallery" using MediaWiki API
    url = "https://mobile-legends.fandom.com/api.php"
    params = {
        "action": "query",
        "prop": "images",
        "titles": "Miya/Cosmetics",
        "imlimit": 100,
        "format": "json"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code == 200:
            pages = r.json().get("query", {}).get("pages", {})
            for pid, page in pages.items():
                images = page.get("images", [])
                print(f"Found {len(images)} images on Miya/Gallery:")
                for img in images:
                    title = img.get("title")
                    if 'render' in title.lower() or 'original' in title.lower() or 'default' in title.lower() or 'model' in title.lower() or 'artwork' in title.lower() or '.png' in title.lower():
                        print(f"- {title}")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
