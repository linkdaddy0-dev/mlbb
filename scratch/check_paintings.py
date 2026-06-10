import os

paintings_dir = r"c:\Users\rosha\Documents\MLBB\public\assets\paintings"
files = [f"hero_4.webp", f"hero_22.webp"]

for f in files:
    path = os.path.join(paintings_dir, f)
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    print(f"{f}: {'Exists' if exists else 'Missing'} ({size} bytes)")
