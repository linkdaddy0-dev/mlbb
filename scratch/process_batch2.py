import os
from PIL import Image

images_to_process = {
    34: r"C:\Users\rosha\Downloads\estes.png",
    33: r"C:\Users\rosha\Downloads\cyclops.png",
    36: r"C:\Users\rosha\Downloads\arora.png",
    39: r"C:\Users\rosha\Downloads\roger.png",
    51: r"C:\Users\rosha\Downloads\Helcurt.png",
    53: r"C:\Users\rosha\Downloads\lesley.png",
    88: r"C:\Users\rosha\Downloads\Masha.png",
    87: r"C:\Users\rosha\Downloads\Baxia.png",
    86: r"C:\Users\rosha\Downloads\Lylia.png",
    85: r"C:\Users\rosha\Downloads\dyrroth.png",
    60: r"C:\Users\rosha\Downloads\Hanabi.png",
    59: r"C:\Users\rosha\Downloads\Uranus.png",
    58: r"C:\Users\rosha\Downloads\martis.png",
    57: r"C:\Users\rosha\Downloads\Valir.png",
    56: r"C:\Users\rosha\Downloads\gusion.png",
    55: r"C:\Users\rosha\Downloads\Angela.png",
    54: r"C:\Users\rosha\Downloads\Jawhead.png",
    52: r"C:\Users\rosha\Downloads\pharsa.png",
    50: r"C:\Users\rosha\Downloads\Zhask.png",
    48: r"C:\Users\rosha\Downloads\diggie.png",
    47: r"C:\Users\rosha\Downloads\lancealot.png",
    45: r"C:\Users\rosha\Downloads\Argus.png",
    44: r"C:\Users\rosha\Downloads\Grock.png",
    43: r"C:\Users\rosha\Downloads\Irithel .png",
    40: r"C:\Users\rosha\Downloads\Karrie.png",
    38: r"C:\Users\rosha\Downloads\vexiena.png",
    37: r"C:\Users\rosha\Downloads\lapu-lapu.png",
    35: r"C:\Users\rosha\Downloads\hilda.png"
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
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                painting_path = os.path.join(paintings_dir, f"hero_{hid}.webp")
                banner_path = os.path.join(banners_dir, f"hero_{hid}_transparent.webp")
                
                img.save(painting_path, "WEBP", quality=85)
                img.save(banner_path, "WEBP", quality=85)
                
                print(f"  [OK] Saved to paintings and banners.")
                success.append((hid, src_path))
                
        except Exception as e:
            print(f"  [ERROR] Processing failed: {e}")
            failed.append((hid, str(e)))
            
    print("\nProcessing completed.")
    print(f"Successfully processed: {len(success)} heroes")
    print(f"Failed: {len(failed)} heroes")

if __name__ == '__main__':
    main()
