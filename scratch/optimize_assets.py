import os
import json
from PIL import Image

def optimize_json_file(file_path):
    print(f"Optimizing JSON: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Structure of draft_matrix is: { "hero_id": { "strong_against": [...], "weak_against": [...], "synergy": [...] } }
        modified = False
        for hero_id, categories in data.items():
            if not isinstance(categories, dict):
                continue
            for cat in ["strong_against", "weak_against", "synergy"]:
                if cat in categories and isinstance(categories[cat], list):
                    new_list = []
                    for item in categories[cat]:
                        if not isinstance(item, dict):
                            new_list.append(item)
                            continue
                        # Keep only id and score
                        new_item = {}
                        if "id" in item:
                            new_item["id"] = item["id"]
                        if "score" in item:
                            new_item["score"] = item["score"]
                        new_list.append(new_item)
                    categories[cat] = new_list
                    modified = True
                    
        if modified:
            # Write minified JSON
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"Successfully optimized and minified: {file_path}")
    except Exception as e:
        print(f"Error optimizing {file_path}: {e}")

def compress_logo(logo_path):
    print(f"Compressing logo: {logo_path}")
    try:
        img = Image.open(logo_path)
        print(f"Original format: {img.format}, size: {img.size}")
        
        # If the image is large, we can resize it to a max width/height of 512px (which is plenty for a logo)
        max_size = (512, 512)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save with optimization and quantize to 256 colors if transparent or convert to P mode
        # This will reduce the file size dramatically while preserving transparency
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Quantize RGBA to save as 8-bit palette with alpha (PNG8)
            alpha = img.split()[3]
            img_rgb = img.convert('RGB')
            # Quantize RGB image
            img_quant = img_rgb.quantize(colors=256, method=Image.MAXCOVERAGE)
            # Add back alpha channel
            # Wait, standard PIL saving quantize with transparency can be done by converting to 'P' mode with palette
            # Let's do adaptive palette quantization with transparency:
            img = img.convert('P', palette=Image.ADAPTIVE, colors=256)
        
        img.save(logo_path, format='PNG', optimize=True)
        print(f"Compressed and saved: {logo_path}")
    except Exception as e:
        print(f"Error compressing logo: {e}")

if __name__ == "__main__":
    # 1. Optimize draft matrices
    patches_dir = r"c:\Users\rosha\Documents\MLBB\public\data\patches\1.8.84"
    if os.path.exists(patches_dir):
        for lang in os.listdir(patches_dir):
            lang_dir = os.path.join(patches_dir, lang)
            if os.path.isdir(lang_dir):
                matrix_file = os.path.join(lang_dir, "draft_matrix.json")
                if os.path.exists(matrix_file):
                    optimize_json_file(matrix_file)

    # Optimize fallback matrix
    fallback_file = r"c:\Users\rosha\Documents\MLBB\src\data\fallback_matrix.json"
    if os.path.exists(fallback_file):
        optimize_json_file(fallback_file)

    # 2. Compress logo.png
    logo_file = r"c:\Users\rosha\Documents\MLBB\public\logo.png"
    if os.path.exists(logo_file):
        compress_logo(logo_file)
