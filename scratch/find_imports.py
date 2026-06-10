with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines[:100]):
    if 'import' in line and ('data' in line or 'json' in line):
        print(f"Line {idx+1}: {line.strip()[:100]}")
