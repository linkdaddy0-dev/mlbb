import os
import requests
from PIL import Image
from io import BytesIO

def download_and_generate(h_id, url):
    painting_path = f"public/assets/paintings/hero_{h_id}.webp"
    banner_path = f"public/assets/banners/hero_{h_id}.webp"
    
    print(f"\nProcessing Hero {h_id}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        # 1. Download official painting (transparent WebP)
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code != 200:
            print(f"Failed to download painting: HTTP {r.status_code}")
            return
            
        # Ensure directories exist
        os.makedirs(os.path.dirname(painting_path), exist_ok=True)
        os.makedirs(os.path.dirname(banner_path), exist_ok=True)
        
        # Save painting directly as raw bytes (preserves Moonton transparent WebP exactly)
        with open(painting_path, "wb") as f:
            f.write(r.content)
        print(f"Saved painting: {painting_path} ({len(r.content)/1024:.1f} KB)")
        
        # 2. Open and generate compressed banner asset
        img = Image.open(BytesIO(r.content))
        width, height = img.size
        new_width = 480
        new_height = int(height * (new_width / width))
        
        # Resize maintaining aspect ratio
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        img_resized.save(banner_path, "WEBP", quality=60)
        print(f"Generated compressed banner: {banner_path} ({os.path.getsize(banner_path)/1024:.1f} KB) - {new_width}x{new_height}")
        
    except Exception as e:
        print(f"Error processing hero {h_id}: {e}")

def main():
    # Official verified Moonton GMS painting URLs
    hero_urls = {
        127: "https://akmweb.youngjoygame.com/web/gms/image/1bea09e43f6b02845de97af863c53da5.webp", # Lukas (Fighter)
        128: "https://akmweb.youngjoygame.com/web/gms/image/3a7693b9a565b4e1d67d57ae73eb5297.webp", # Kalea (Support)
        129: "https://akmweb.youngjoygame.com/web/gms/image/10cf23ade94859fd7f6a877c828c0131.webp", # Zetian (Mage)
        132: "https://akmweb.youngjoygame.com/web/gms/image/24c43180662d27aa5b62106b596fa4f7.webp"  # Marcel (Support)
    }
    
    for h_id, url in hero_urls.items():
        download_and_generate(h_id, url)

if __name__ == '__main__':
    main()
