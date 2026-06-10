import json

with open('src/data/fallback_roster.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

print("Check fallback roster keys:")
print(list(fr[0].keys()))

with open('public/data/patches/1.8.84/en/heroes/index.json', 'r', encoding='utf-8') as f:
    idx = json.load(f)

print("Check index.json keys:")
print(list(idx[0].keys()))
