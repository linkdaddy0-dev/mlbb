from PIL import Image

for hero_id in [4, 22]:
    path = f"public/assets/paintings/hero_{hero_id}.webp"
    try:
        with Image.open(path) as img:
            print(f"Hero {hero_id} ({path}): mode={img.mode}, size={img.size}, has_alpha={'A' in img.mode}")
    except Exception as e:
        print(f"Error reading Hero {hero_id}: {e}")
