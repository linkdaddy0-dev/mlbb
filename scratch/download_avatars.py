import os
import requests
from PIL import Image
from io import BytesIO

def download_and_convert(h_id, url):
    dest_path = f"public/assets/heroes/Hero{h_id}1-icon.webp"
    print(f"Downloading avatar for hero {h_id} from {url}...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 200:
            img = Image.open(BytesIO(r.content))
            # Convert to WebP and save
            img.save(dest_path, "WEBP", quality=95)
            print(f"Saved: {dest_path}")
        else:
            print(f"Failed to download {url}: Status code {r.status_code}")
    except Exception as e:
        print(f"Error processing hero {h_id}: {e}")

def main():
    os.makedirs("public/assets/heroes", exist_ok=True)
    
    # Official mapping URLs from data/avatar_map.json
    urls = {
        127: "https://akmweb.youngjoygame.com/web/gms/image/12a9a4f54f6f0e874a7ee51a84eda237.jpg", # Lukas
        128: "https://akmweb.youngjoygame.com/web/gms/image/f81399d64f2916499d853ca32c85902d.jpg", # Kalea
        129: "https://akmweb.youngjoygame.com/web/gms/image/20a263b2adb23ad40cd955b9abf4bbb0.jpg", # Zetian
        132: "https://akmweb.youngjoygame.com/web/gms/image/e7aa2ab69d15fc168b2d60b0e5ed0a1e.jpg"  # Marcel
    }
    
    for h_id, url in urls.items():
        download_and_convert(h_id, url)

if __name__ == '__main__':
    main()
