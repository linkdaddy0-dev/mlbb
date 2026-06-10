import os
import shutil

transparent_ids = [1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 16, 17, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 43, 44, 45, 47, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 85, 86, 87, 88, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132]

paintings_dir = "public/assets/paintings"
banners_dir = "public/assets/banners"

copied = 0
for hid in transparent_ids:
    painting_path = os.path.join(paintings_dir, f"hero_{hid}.webp")
    banner_path = os.path.join(banners_dir, f"hero_{hid}_transparent.webp")
    
    if not os.path.exists(banner_path):
        if os.path.exists(painting_path):
            print(f"Copying {painting_path} -> {banner_path}")
            shutil.copy(painting_path, banner_path)
            copied += 1
        else:
            print(f"[WARNING] Painting not found for Hero {hid} at {painting_path}")

print(f"Done! Copied {copied} files.")
