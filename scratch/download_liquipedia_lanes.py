import hashlib
import urllib.request
import os

filenames = {
    "lane_roam.png": "Mobile_Legends_Roamer.png"
}

dest_dir = "public/assets/icons"
os.makedirs(dest_dir, exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for local_name, filename in filenames.items():
    m = hashlib.md5(filename.encode('utf-8')).hexdigest()
    first_char = m[0]
    first_two = m[:2]
    
    url = f"https://liquipedia.net/commons/images/{first_char}/{first_two}/{filename}"
    dest_path = os.path.join(dest_dir, local_name)
    
    print(f"Downloading {filename} from {url}...")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            with open(dest_path, 'wb') as out_file:
                out_file.write(response.read())
        print(f"Successfully saved to {dest_path}")
    except Exception as e:
        print(f"Failed to download from Liquipedia: {e}")
