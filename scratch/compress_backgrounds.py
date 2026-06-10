import os
from PIL import Image

def compress_image(src_path, dest_path):
    print(f"Compressing {src_path} to {dest_path}...")
    try:
        img = Image.open(src_path)
        # Convert RGBA to RGB if saving as non-transparent WebP, or preserve RGBA if it has transparency
        # Since these are background images, they are likely fully opaque. Let's check mode
        original_mode = img.mode
        if original_mode == "RGBA":
            # Just keep RGBA for safety, or convert to RGB if fully opaque
            # Converting to RGB if there's no actual alpha transparency saves space
            alpha = img.split()[-1]
            min_alpha = alpha.getextrema()[0]
            if min_alpha == 255:
                img = img.convert("RGB")
        elif original_mode != "RGB":
            img = img.convert("RGB")
            
        img.save(dest_path, "WEBP", quality=75)
        print(f"Saved: {dest_path} ({os.path.getsize(dest_path)/1024:.1f} KB)")
    except Exception as e:
        print(f"Error compressing {src_path}: {e}")

def main():
    os.makedirs("public/assets/misc", exist_ok=True)
    
    mappings = {
        r"C:\Users\rosha\Downloads\light mode mobile.png": "public/assets/misc/light_mobile_bg.webp",
        r"C:\Users\rosha\Downloads\light mode tab.png": "public/assets/misc/light_tab_bg.webp",
        r"C:\Users\rosha\Downloads\dark mode mobile.png": "public/assets/misc/dark_mobile_bg.webp",
        r"C:\Users\rosha\Downloads\dark mode tab.png": "public/assets/misc/dark_tab_bg.webp"
    }
    
    for src, dest in mappings.items():
        if os.path.exists(src):
            compress_image(src, dest)
        else:
            print(f"Source file not found: {src}")

if __name__ == '__main__':
    main()
