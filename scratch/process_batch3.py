import os
from PIL import Image

images_to_process = {
    62: r"C:\Users\rosha\Downloads\kaja.png",
    63: r"C:\Users\rosha\Downloads\Selena.png",
    64: r"C:\Users\rosha\Downloads\Aldous.png",
    90: r"C:\Users\rosha\Downloads\silvana.png",
    65: r"C:\Users\rosha\Downloads\Claude.png",
    66: r"C:\Users\rosha\Downloads\vale.png",
    67: r"C:\Users\rosha\Downloads\Leomord.png",
    68: r"C:\Users\rosha\Downloads\Lunox.png",
    69: r"C:\Users\rosha\Downloads\Hanzo.png",
    70: r"C:\Users\rosha\Downloads\Belerick.png",
    71: r"C:\Users\rosha\Downloads\Kimmy.png",
    72: r"C:\Users\rosha\Downloads\Thamuz.png",
    73: r"C:\Users\rosha\Downloads\Harith.png",
    74: r"C:\Users\rosha\Downloads\Minshittar.png",
    75: r"C:\Users\rosha\Downloads\kadita.png",
    76: r"C:\Users\rosha\Downloads\Faramis.png",
    77: r"C:\Users\rosha\Downloads\badang.png",
    78: r"C:\Users\rosha\Downloads\Khufra.png",
    79: r"C:\Users\rosha\Downloads\granger.png",
    80: r"C:\Users\rosha\Downloads\Mlbb Guinevere .png",
    81: r"C:\Users\rosha\Downloads\Mlbb Esmeralda .png",
    82: r"C:\Users\rosha\Downloads\Terizla.png",
    83: r"C:\Users\rosha\Downloads\X Borg.png",
    84: r"C:\Users\rosha\Downloads\ling.png",
    114: r"C:\Users\rosha\Downloads\mellisa.png",
    115: r"C:\Users\rosha\Downloads\Xavier.png",
    89: r"C:\Users\rosha\Downloads\wanwan.png",
    91: r"C:\Users\rosha\Downloads\Cecilion.png",
    92: r"C:\Users\rosha\Downloads\Carmila.png",
    93: r"C:\Users\rosha\Downloads\Atlas.png",
    96: r"C:\Users\rosha\Downloads\Luo Yi.png",
    97: r"C:\Users\rosha\Downloads\Benedetta.png",
    98: r"C:\Users\rosha\Downloads\Khaleed.png",
    100: r"C:\Users\rosha\Downloads\Brody.png",
    101: r"C:\Users\rosha\Downloads\yve.png",
    102: r"C:\Users\rosha\Downloads\Mathilda.png",
    104: r"C:\Users\rosha\Downloads\Gloo.png",
    122: r"C:\Users\rosha\Downloads\Nolan.png",
    38: r"C:\Users\rosha\Downloads\vexena.png",
    118: r"C:\Users\rosha\Downloads\joy.png",
    117: r"C:\Users\rosha\Downloads\fredrinn_mlbb_png_transparant_by_dechunf_dfbdtjp-pre.png",
    112: r"C:\Users\rosha\Downloads\floryn___the_budding_hope___png_mobile_legends_by_dijemaru_dfterxs-375w-2x.png",
    109: r"C:\Users\rosha\Downloads\aamon_mobile_legends_png_by_dechunf_detkbqu-pre.png",
    108: r"C:\Users\rosha\Downloads\aulus_png_by_teh90blog_der1f0a-pre.png",
    105: r"C:\Users\rosha\Downloads\beatrix_png_by_teh90blog_denckji-pre.png",
    106: r"C:\Users\rosha\Downloads\phoveus_png_by_teh90blog_der1ewd-pre.png",
    111: r"C:\Users\rosha\Downloads\edith_png_by_teh90blog_dfb5g9n-pre.png",
    43: r"C:\Users\rosha\Downloads\irithel_png_by_teh90blog_dfb5i5y-pre.png",
    103: r"C:\Users\rosha\Downloads\paquito_png_by_teh90blog_der1eth-pre.png",
    99: r"C:\Users\rosha\Downloads\barats_png_by_teh90blog_der1f23-pre.png",
    95: r"C:\Users\rosha\Downloads\Yu Zhong.png",
    94: r"C:\Users\rosha\Downloads\mobile_legends_popol_and_kupa_transparent_4k_png_by_divoras_deeji6b-pre.png",
    116: r"C:\Users\rosha\Downloads\MLBB_Julian.png",
    61: r"C:\Users\rosha\Downloads\Chang'e.png"
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
