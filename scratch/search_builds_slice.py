with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "detailHeroData.builds.items.slice(0, 6)" in line or "builds.items.slice(0, 6)" in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
