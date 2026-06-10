import json
with open('public/data/patches/1.8.84/en/draft_matrix.json', 'r', encoding='utf-8') as f:
    m = json.load(f)
miya = m.get('1')
print('STRONG AGAINST:')
for x in miya.get('strong_against', [])[:10]:
    print(f"  {x['name']} ({x['score']}): {x['reason']}")
print('WEAK AGAINST:')
for x in miya.get('weak_against', [])[:10]:
    print(f"  {x['name']} ({x['score']}): {x['reason']}")
print('SYNERGY:')
for x in miya.get('synergy', [])[:10]:
    print(f"  {x['name']} ({x['score']}): {x['reason']}")
