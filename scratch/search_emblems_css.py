with open('src/index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'emblem-container-row' in line or 'emblem-left-card' in line or 'emblem-talents-stack' in line or 'emblem-talent-card' in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
