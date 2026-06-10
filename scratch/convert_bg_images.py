import os
from PIL import Image

src_images = {
    "light_mobile": r"C:\Users\rosha\Downloads\ChatGPT Image Jun 8, 2026, 01_20_52 AM.png",
    "light_tablet": r"C:\Users\rosha\Downloads\f3712fd9-1280-4df6-a263-b28983c742ef.png",
    "dark_mobile": r"C:\Users\rosha\Downloads\777635f8-5977-410a-be19-4689baa2e928.png",
    "dark_tablet": r"C:\Users\rosha\Downloads\57a6071d-3386-4d1a-86b1-c0e87265ee76.png"
}

dest_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\backgrounds"
os.makedirs(dest_dir, exist_ok=True)

for key, path in src_images.items():
    if not os.path.exists(path):
        print(f"Error: {path} does not exist!")
        continue
    try:
        dest_path = os.path.join(dest_dir, f"bg_hero_{key}.webp")
        print(f"Converting {path} -> {dest_path}")
        with Image.open(path) as img:
            # Save as WebP with compression
            img.save(dest_path, "WEBP", quality=80)
        print(f"Successfully converted and compressed {key} background.")
    except Exception as e:
        print(f"Failed to convert {key}: {e}")
