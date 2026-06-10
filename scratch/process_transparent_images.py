import os
import json
from PIL import Image

images_to_process = {
    32: r"C:\Users\rosha\Downloads\johnson.png",
    30: r"C:\Users\rosha\Downloads\Yi Sun-shin.png",
    29: r"C:\Users\rosha\Downloads\ruby.png",
    28: r"C:\Users\rosha\Downloads\Alpha.png",
    27: r"C:\Users\rosha\Downloads\sun.png",
    26: r"C:\Users\rosha\Downloads\chow.png",
    25: r"C:\Users\rosha\Downloads\kagura.png",
    1: r"C:\Users\rosha\Downloads\miya.png",
    24: r"C:\Users\rosha\Downloads\Natalia.png",
    23: r"C:\Users\rosha\Downloads\Gord.png",
    21: r"C:\Users\rosha\Downloads\Hayabusa.png",
    20: r"C:\Users\rosha\Downloads\lolita.png",
    17: r"C:\Users\rosha\Downloads\fanny.png",
    16: r"C:\Users\rosha\Downloads\zilong.png",
    14: r"C:\Users\rosha\Downloads\rafaela.png",
    13: r"C:\Users\rosha\Downloads\clint.png",
    12: r"C:\Users\rosha\Downloads\burno.png",
    11: r"C:\Users\rosha\Downloads\bane.png",
    10: r"C:\Users\rosha\Downloads\franco.png",
    9: r"C:\Users\rosha\Downloads\akai.png",
    7: r"C:\Users\rosha\Downloads\Alucard.png",
    6: r"C:\Users\rosha\Downloads\Tigreal.png",
    5: r"C:\Users\rosha\Downloads\nana.png",
    3: r"C:\Users\rosha\Downloads\saber.png",
    2: r"C:\Users\rosha\Downloads\Balmond.png"
}

def main():
    paintings_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\paintings"
    banners_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\banners"
    
    os.makedirs(paintings_dir, exist_ok=True)
    os.makedirs(banners_dir, exist_ok=True)
    
    success = []
    failed = []
    
    for hid, src_path in sorted(images_to_process.items()):
        if not os.path.exists(src_path):
            print(f"[ERROR] Source file not found for Hero {hid}: {src_path}")
            failed.append((hid, "File not found"))
            continue
            
        print(f"Processing Hero {hid} from {src_path}...")
        try:
            with Image.open(src_path) as img:
                # Keep or convert to RGBA to preserve transparency
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                # Check transparency
                alpha = img.split()[-1]
                extrema = alpha.getextrema()
                if extrema[0] == 255:
                    print(f"  [WARNING] Image does not seem to have transparent pixels: extrema={extrema}")
                
                # Target paths
                painting_path = os.path.join(paintings_dir, f"hero_{hid}.webp")
                banner_path = os.path.join(banners_dir, f"hero_{hid}_transparent.webp")
                
                # Compress and save as WebP
                # Quality 85 is usually an excellent balance of file size and visual fidelity
                img.save(painting_path, "WEBP", quality=85)
                img.save(banner_path, "WEBP", quality=85)
                
                print(f"  [OK] Saved to paintings and banners. Size: {img.size}")
                success.append((hid, src_path))
                
        except Exception as e:
            print(f"  [ERROR] Processing failed: {e}")
            failed.append((hid, str(e)))
            
    print("\nProcessing completed.")
    print(f"Successfully processed: {len(success)} heroes")
    print(f"Failed: {len(failed)} heroes")
    if failed:
        for hid, err in failed:
            print(f"  - Hero {hid}: {err}")

if __name__ == '__main__':
    main()
