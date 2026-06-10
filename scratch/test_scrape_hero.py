import requests
import re
from bs4 import BeautifulSoup

def get_hero_transparent_url(hero_name):
    # Format hero name for URL (e.g., "Yi Sun-shin" -> "Yi_Sun-shin", "Popol and Kupa" -> "Popol_and_Kupa")
    formatted_name = hero_name.replace(' ', '_')
    url = f"https://mobile-legends.fandom.com/wiki/{formatted_name}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"Failed to fetch page for {hero_name}: HTTP {r.status_code}")
            return None
            
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # 1. Search in Portable Infobox image tag
        infobox = soup.find('aside', class_='portable-infobox')
        if infobox:
            img_tag = infobox.find('img', class_='pi-image-thumbnail')
            if img_tag and img_tag.get('src'):
                # Clean up revision URL to get the full-res original image
                src = img_tag.get('src')
                clean_url = src.split('/revision/')[0]
                return clean_url
                
        # 2. Fallback: search for any image with "portrait" or the hero name in it
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if 'portrait' in src.lower() and formatted_name.lower() in src.lower():
                clean_url = src.split('/revision/')[0]
                return clean_url
                
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
