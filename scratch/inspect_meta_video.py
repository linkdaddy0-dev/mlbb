import json
import os

path = 'src/data/hero_meta_stats.json'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("Sample hero meta stats containing guide_video:")
    count = 0
    for hero in data:
        if 'guide_video' in hero:
            print(f"- {hero['name']}: {hero['guide_video']}")
            count += 1
            if count >= 5:
                break
    if count == 0:
        print("No hero has 'guide_video' key inside hero_meta_stats.json!")
else:
    print("File not found.")
