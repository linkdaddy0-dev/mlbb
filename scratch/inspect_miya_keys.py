import json
with open('public/data/patches/1.8.84/en/draft_matrix.json', 'r', encoding='utf-8') as f:
    m = json.load(f)
miya = m.get('1')
for key in miya:
    val = miya[key]
    if isinstance(val, list):
        print(f"Key: {key}, Length: {len(val)}")
        print("Top 5:")
        for x in val[:5]:
            print(f"  {x.get('name')} ({x.get('score')}): {x.get('reason')}")
