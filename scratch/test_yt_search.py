import urllib.request
import urllib.parse
import re

hero_name = "Franco"
query = f"Mobile Legends {hero_name} Hero Spotlight"
url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    # Search for videoIds in the page content
    video_ids = re.findall(r'"videoId":"([^"]+)"', html)
    if video_ids:
        # Get unique video IDs while preserving order
        unique_ids = list(dict.fromkeys(video_ids))
        print(f"Successfully found video IDs for {hero_name}:")
        for i, vid in enumerate(unique_ids[:5]):
            print(f"- Video {i+1}: https://www.youtube.com/watch?v={vid}")
    else:
        print("No video IDs found in search results.")
except Exception as e:
    print(f"Error fetching YouTube page: {e}")
