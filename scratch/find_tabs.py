with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'activeTab' in line and ('state' in line.lower() or '=' in line):
        print(f"Line {idx+1}: {line.strip()[:100]}")
