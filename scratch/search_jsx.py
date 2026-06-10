with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

search_words = ['tips', 'skills', 'build', 'guide', 'combo', 'matchup', 'spell']
for idx, line in enumerate(lines):
    for w in search_words:
        if w in line.lower() and ('render' in line.lower() or 'const' in line.lower() or 'function' in line.lower() or 'map(' in line.lower() or '&&' in line.lower() or '<div' in line.lower() or 'class' in line.lower()):
            print(f"{idx+1}: {line.strip()[:100]}")
            break
