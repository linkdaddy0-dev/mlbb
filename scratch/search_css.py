with open('src/index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'recommended-spells-row' in line or 'spell-item-card' in line or 'spell-item-icon' in line or 'spell-item-info' in line or 'spell-item-name' in line or 'spell-item-desc' in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
