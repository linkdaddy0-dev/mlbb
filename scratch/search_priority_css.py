with open('src/index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'upgrade-priority-row' in line or 'upgrade-chevron' in line or 'upgrade-skill-icon-wrapper' in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
