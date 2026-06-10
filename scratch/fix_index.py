import json
import os

index_path = 'public/data/patches/1.8.84/en/heroes/index.json'
with open(index_path, 'r', encoding='utf-8') as f:
    heroes = json.load(f)

updated_count = 0
for h in heroes:
    detail_path = f"public/data/patches/1.8.84/en/heroes/{h['id']}.json"
    if os.path.exists(detail_path):
        with open(detail_path, 'r', encoding='utf-8') as df:
            detail = json.load(df)
        det_ct = detail.get('cover_transparent')
        if det_ct and h.get('cover_transparent') != det_ct:
            h['cover_transparent'] = det_ct
            updated_count += 1

with open(index_path, 'w', encoding='utf-8') as f:
    json.dump(heroes, f, ensure_ascii=False, indent=2)

print(f"Successfully updated cover_transparent for {updated_count} heroes in index.json!")
