from PIL import Image

for hero_id in [4, 22]:
    path = f"public/assets/paintings/hero_{hero_id}.webp"
    try:
        with Image.open(path) as img:
            alpha = img.split()[-1]
            extrema = alpha.getextrema()
            print(f"Hero {hero_id} alpha channel extrema (min, max): {extrema}")
    except Exception as e:
        print(f"Error checking alpha for Hero {hero_id}: {e}")
