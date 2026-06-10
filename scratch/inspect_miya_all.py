import json
with open('public/data/patches/1.8.84/en/draft_matrix.json', 'r', encoding='utf-8') as f:
    m = json.load(f)
miya = m.get('1')
print('ALL WEAK AGAINST:')
for x in miya.get('weak_against', []):
    print(f"  {x['name']} ({x['score']}): {x['reason']}")
