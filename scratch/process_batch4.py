import os
from PIL import Image

images_to_process = {
    107: r"C:\Users\rosha\Downloads\natan.png",
    110: r"C:\Users\rosha\Downloads\valentina_by_teh90blog_df3tsx1-pre.png"
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
