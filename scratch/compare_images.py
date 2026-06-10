import os
from PIL import Image
import numpy as np

banners_dir = "public/assets/banners"
paintings_dir = "public/assets/paintings"

ids = [127, 128, 129, 132]

def get_img_hash(path):
    img = Image.open(path).convert('L').resize((32, 32))
    return np.array(img)

hashes_banners = {i: get_img_hash(os.path.join(banners_dir, f"hero_{i}.webp")) for i in ids}
hashes_paintings = {i: get_img_hash(os.path.join(paintings_dir, f"hero_{i}.webp")) for i in ids}

print("Comparing banners vs paintings:")
for b_id, b_hash in hashes_banners.items():
    best_match = None
    min_diff = float('inf')
    for p_id, p_hash in hashes_paintings.items():
        diff = np.mean((b_hash - p_hash) ** 2)
        if diff < min_diff:
            min_diff = diff
            best_match = p_id
    print(f"Banner hero_{b_id}.webp matches Painting hero_{best_match}.webp with MSE diff: {min_diff:.2f}")
