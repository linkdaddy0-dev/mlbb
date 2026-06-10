with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Guide Videos' in line:
        # Print surrounding lines
        for j in range(max(0, idx - 2), min(idx + 10, len(lines))):
            print(f"{j+1}: {lines[j].strip()[:100]}")
        break
