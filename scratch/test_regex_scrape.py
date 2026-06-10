import requests
import re

def get_hero_transparent_url(hero_name):
    # Format hero name for URL (e.g., "Yi Sun-shin" -> "Yi_Sun-shin", "Popol and Kupa" -> "Popol_and_Kupa")
    formatted_name = hero_name.replace(' ', '_')
    url = f"https://mobile-legends.fandom.com/wiki/{formatted_name}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }
    
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"Failed to fetch page for {hero_name}: HTTP {r.status_code}")
            return None
            
        html = r.text
        
        # Search for the schema image URL
        # e.g., "image":"https://static.wikia.nocookie.net/mobile-legends/images/8/89/Hero011-portrait.png/revision/latest?cb=20250407160822"
        match = re.search(r'"image"\s*:\s*"https://static\.wikia\.nocookie\.net/mobile-legends/images/([^"]+)"', html)
        if match:
            path = match.group(1)
            # Remove revision details to get raw original image
            clean_path = path.split('/revision/')[0]
            return f"https://static.wikia.nocookie.net/mobile-legends/images/{clean_path}"
            
    except Exception as e:
        print(f"Error scraping {hero_name}: {e}")
        
    return None

def main():
    test_heroes = ["Miya", "Franco", "Yi Sun-shin", "Popol and Kupa", "Aamon"]
    for hero in test_heroes:
        url = get_hero_transparent_url(hero)
        print(f"{hero}: {url}")

if __name__ == '__main__':
    main()
