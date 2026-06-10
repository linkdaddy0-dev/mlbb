import os
from PIL import Image

def generate_opaque_banner(h_id, bg_color=(15, 23, 42)):
    painting_path = f"public/assets/paintings/hero_{h_id}.webp"
    banner_path = f"public/assets/banners/hero_{h_id}.webp"
    
    if not os.path.exists(painting_path):
        print(f"Error: Painting for Hero {h_id} not found at {painting_path}")
        return
        
    try:
        # Open transparent painting
        img = Image.open(painting_path)
        
        # Calculate resized dimensions maintaining aspect ratio (width = 480px)
        width, height = img.size
        new_width = 480
        new_height = int(height * (new_width / width))
        
        # Resize transparent image
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create solid background image
        bg = Image.new("RGB", (new_width, new_height), bg_color)
        
        # If the resized image has an alpha channel, paste it using itself as the mask
        if img_resized.mode in ("RGBA", "LA") or (img_resized.mode == "P" and "transparency" in img_resized.info):
            bg.paste(img_resized, (0, 0), img_resized.convert("RGBA"))
        else:
            bg.paste(img_resized, (0, 0))
            
        # Save as solid RGB WebP
        bg.save(banner_path, "WEBP", quality=75)
        print(f"Generated solid RGB banner for Hero {h_id} at {banner_path} ({os.path.getsize(banner_path)/1024:.1f} KB)")
        
    except Exception as e:
        print(f"Error generating banner for Hero {h_id}: {e}")

def main():
    target_ids = [127, 128, 129, 132]  # Lukas, Kalea, Zetian, Marcel
    bg_color = (15, 23, 42)  # #0f172a
    
    for h_id in target_ids:
        generate_opaque_banner(h_id, bg_color)

if __name__ == '__main__':
    main()
