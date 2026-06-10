import requests

def main():
    # Query image info
    url = "https://mobile-legends.fandom.com/api.php"
    params = {
        "action": "query",
        "prop": "imageinfo",
        "titles": "File:Hero011-portrait.png",
        "iiprop": "url|size|mime",
        "format": "json"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        print("Status Code:", r.status_code)
        if r.status_code == 200:
            print("Response:", r.json())
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
