import urllib.request
import re

urls = [
    "https://mobile-legends.fandom.com/wiki/File:Icon_Gold_Lane.png",
    "https://mobile-legends.fandom.com/wiki/File:Icon_EXP_Lane.png",
    "https://mobile-legends.fandom.com/wiki/File:Icon_Mid_Lane.png",
    "https://mobile-legends.fandom.com/wiki/File:Icon_Jungle.png",
    "https://mobile-legends.fandom.com/wiki/File:Icon_Roam.png"
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for url in urls:
    print(f"\n--- SCRAPING PAGE: {url} ---")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Look for static.wikia.nocookie.net links
            matches = re.findall(r'https://static\.wikia\.nocookie\.net/mobile-legends/images/[^"\s>]+', html)
            for m in list(set(matches)):
                clean = m.split('/revision/')[0]
                filename = clean.split('/')[-1]
                if 'icon' in filename.lower() or 'lane' in filename.lower() or 'roam' in filename.lower() or 'jungle' in filename.lower():
                    print(f"Match: {filename} -> {clean}")
    except Exception as e:
        print(f"Error scraping {url}: {e}")
