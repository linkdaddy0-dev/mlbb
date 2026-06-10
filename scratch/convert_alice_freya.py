import os
from PIL import Image

src_files = {
    4: r"C:\Users\rosha\Downloads\alice_png_by_teh90blog_denck5x-pre.png",
    22: r"C:\Users\rosha\Downloads\mobile_legends_freya_transparent__3__by_b_la_ze_dc9qr15-fullview.png"
}

dest_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\paintings"

for hero_id, path in src_files.items():
    if not os.path.exists(path):
        print(f"Error: {path} does not exist!")
        continue
    try:
        dest_path = os.path.join(dest_dir, f"hero_{hero_id}.webp")
        print(f"Converting {path} -> {dest_path}")
        with Image.open(path) as img:
            # Check if RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Optionally resize to a reasonable maximum dimension (e.g., 800px) to optimize performance
            max_size = 800
            if max(img.size) > max_size:
                ratio = max_size / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            img.save(dest_path, "WEBP", quality=85)
        print(f"Successfully converted and updated transparent painting for hero {hero_id}.")
    except Exception as e:
        print(f"Failed to convert hero {hero_id}: {e}")
