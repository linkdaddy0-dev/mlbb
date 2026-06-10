from PIL import Image

for hero_id in [1, 4, 22]:
    path = f"public/assets/paintings/hero_{hero_id}.webp"
    try:
        with Image.open(path) as img:
            alpha = img.split()[-1]
            extrema = alpha.getextrema()
            print(f"Hero {hero_id} ({path}) alpha extrema: {extrema}")
    except Exception as e:
        print(f"Error checking alpha: {e}")
