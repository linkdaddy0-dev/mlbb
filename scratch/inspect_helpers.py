with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    content = f.read()

helpers = ['getMetaVerdict', 'getCombatProfile', 'getProItemDetail', 'getHeroSpells', 'getHeroEmblem', 'getProItemDetail', 'HERO_COMBOS_DATABASE']
for h in helpers:
    if h in content:
        print(f"Helper '{h}' exists in App.jsx!")
    else:
        print(f"WARNING: Helper '{h}' NOT found in App.jsx!")
