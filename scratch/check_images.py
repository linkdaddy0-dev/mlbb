import os
from PIL import Image
import numpy as np

def get_img_hash(path):
    img = Image.open(path).convert('L').resize((32, 32))
    return np.array(img)

def main():
    active_dir = "public/assets/banners"
    brain_dir = r"C:\Users\rosha\.gemini\antigravity-ide\brain\af46b533-c862-4ccd-92a3-23a298e49c92"
    
    # Original mappings from the first dump (before any swaps)
    originals = {
        127: "hero_127_banner_1780692569397.png", # Marcel (red-haired)
        128: "hero_128_banner_1780692574120.png", # Zetian (goddess)
        129: "hero_129_banner_1780692578503.png", # Kalea (pink cat girl)
        132: "hero_132_banner_1780692583415.png"  # Lukas (blue-haired)
    }
    
    # Check what is currently in active folder
    for active_id in [127, 128, 129, 132]:
        active_path = os.path.join(active_dir, f"hero_{active_id}.webp")
        if not os.path.exists(active_path):
            print(f"Active file hero_{active_id}.webp does not exist.")
            continue
            
        active_hash = get_img_hash(active_path)
        
        best_match = None
        min_diff = float('inf')
        for orig_id, orig_filename in originals.items():
            orig_path = os.path.join(brain_dir, orig_filename)
            if not os.path.exists(orig_path):
                continue
                
            orig_hash = get_img_hash(orig_path)
            diff = np.mean((active_hash - orig_hash) ** 2)
            if diff < min_diff:
                min_diff = diff
                best_match = orig_id
                
        # What character name corresponds to each original ID:
        # 127: Marcel, 128: Zetian, 129: Kalea, 132: Lukas (in terms of original image content)
        character_names = {
            127: "Marcel (original 127)",
            128: "Zetian (original 128)",
            129: "Kalea (original 129)",
            132: "Lukas (original 132)"
        }
        
        print(f"Active hero_{active_id}.webp currently contains the image of: {character_names[best_match]} (MSE: {min_diff:.2f})")

if __name__ == '__main__':
    main()
