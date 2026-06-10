import os
import json

raw_dir = r'data/raw/en'
found_video_fields = {}

for file in os.listdir(raw_dir):
    if file.endswith('.json'):
        filepath = os.path.join(raw_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Look for any keys containing video, youtube, url, link, embed
        def search_dict(d, path=""):
            if isinstance(d, dict):
                for k, v in d.items():
                    if any(x in k.lower() for x in ['video', 'youtube', 'url', 'link', 'embed', 'player', 'media']):
                        found_video_fields[k] = v
                    search_dict(v, f"{path}.{k}" if path else k)
            elif isinstance(d, list):
                for idx, item in enumerate(d):
                    search_dict(item, f"{path}[{idx}]")

        search_dict(data)

print("Found video/link-related fields in raw Moonton data:")
for k, v in list(found_video_fields.items())[:20]:
    print(f"- {k}: {str(v)[:150]}")
