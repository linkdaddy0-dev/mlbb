import re

app_path = r"c:\Users\rosha\Documents\MLBB\src\App.jsx"
with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for selectedHero and look around it
# Let's search for lines containing specific keywords
keywords = ['detailHeroData', 'banRate', 'getHeroLore', 'closeHeroDetails', 'selectedHero']
for kw in keywords:
    matches = [i for i, line in enumerate(content.split('\n')) if kw in line]
    print(f"Keyword '{kw}' found on {len(matches)} lines: {matches[:15]}")
