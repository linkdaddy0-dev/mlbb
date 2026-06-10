import os

dist_dir = r"c:\Users\rosha\Documents\MLBB\dist\assets\paintings"
files = [f"hero_4.webp", f"hero_22.webp"]

for f in files:
    path = os.path.join(dist_dir, f)
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    print(f"Dist check: {f} -> {'Exists' if exists else 'Missing'} ({size} bytes)")
