with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'HERO_SPOTLIGHT_VIDEOS' in line and idx > 100:
        print(f"Line {idx+1}: {line.strip()[:100]}")
