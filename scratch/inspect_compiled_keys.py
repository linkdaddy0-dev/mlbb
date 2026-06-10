import os
import json

path = r'public/data/patches/1.8.84/en/heroes/10.json'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("Keys in compiled hero details:", list(data.keys()))
    if 'guide_video' in data:
        print("guide_video content:", data['guide_video'])
    else:
        print("guide_video field is missing from compiled JSON!")
else:
    print("File not found.")
