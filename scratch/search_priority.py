with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'priority' in line.lower() or 'upgrade' in line.lower() or 'skills-sequence-priority' in line.lower():
        if '<div' in line or 'className' in line or 'style' in line:
            print(f"Line {idx+1}: {line.strip()[:100]}")
