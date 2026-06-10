import urllib.request
import re

url = "https://mobile-legends.fandom.com/wiki/File:Icon_Gold_Lane.png"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')
    matches = re.findall(r'https://static\.wikia\.nocookie\.net/mobile-legends/images/[^"\s>]+', html)
    print("ALL MATCHES FOUND:")
    for m in list(set(matches)):
        print(m.split('/revision/')[0])
