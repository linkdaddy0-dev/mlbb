import json
with open('public/data/patches/1.8.84/en/draft_matrix.json', 'r', encoding='utf-8') as f:
    m = json.load(f)
miya = m.get('1')
print(json.dumps(miya, indent=2))
