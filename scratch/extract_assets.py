import urllib.request
import re
import os

def get_images_from_url(url):
    print(f"Fetching {url}...")
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Look for static.wikia.nocookie.net image URLs
            urls = re.findall(r'https://static\.wikia\.nocookie\.net/mobile-legends/images/[^"\s>]+', html)
            return list(set(urls))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

role_urls = get_images_from_url("https://mobile-legends.fandom.com/wiki/Hero_roles")
print("\n--- HERO ROLES URLS FOUND ---")
for url in role_urls:
    # Clean the url by stripping off the /revision/... suffix if present
    clean_url = url.split('/revision/')[0]
    filename = clean_url.split('/')[-1]
    if 'icon' in filename.lower() or any(r in filename.lower() for r in ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support']):
        print(f"{filename}: {clean_url}")

lane_urls = get_images_from_url("https://mobile-legends.fandom.com/wiki/Lanes")
print("\n--- LANES URLS FOUND ---")
for url in lane_urls:
    clean_url = url.split('/revision/')[0]
    filename = clean_url.split('/')[-1]
    if 'lane' in filename.lower() or any(l in filename.lower() for l in ['gold', 'exp', 'mid', 'jungle', 'roam']):
        print(f"{filename}: {clean_url}")
