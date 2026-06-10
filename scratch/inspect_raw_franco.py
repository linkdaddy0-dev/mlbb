import os
import json

raw_path = 'data/raw/en/hero_10.json'
if os.path.exists(raw_path):
    with open(raw_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("Skills info from raw/en/hero_10.json:")
    for idx, s in enumerate(data.get('skill', {}).get('skill', [])):
        print(f"Skill {idx} tips: {s.get('tips')}")
    print(f"Gear tips: {data.get('gear', {}).get('out_pack_tips')}")
else:
    print(f"File {raw_path} not found.")
