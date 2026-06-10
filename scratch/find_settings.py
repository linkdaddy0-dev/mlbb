with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'settings' in line.lower() and ('panel' in line.lower() or 'tab' in line.lower() or 'button' in line.lower()):
        if '<div' in line or 'className' in line:
            print(f"Line {idx+1}: {line.strip()[:100]}")
