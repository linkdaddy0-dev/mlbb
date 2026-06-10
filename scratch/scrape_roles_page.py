import urllib.request
import re

url = "https://mobile-legends.fandom.com/wiki/List_of_heroes"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

print(f"Scraping {url}...")
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        matches = re.findall(r'https://static\.wikia\.nocookie\.net/mobile-legends/images/[^"\s>]+', html)
        for m in list(set(matches)):
            clean = m.split('/revision/')[0]
            filename = clean.split('/')[-1]
            if 'lane' in filename.lower() or 'roam' in filename.lower() or 'jungle' in filename.lower():
                print(f"Found: {filename} -> {clean}")
except Exception as e:
    print(f"Error: {e}")
