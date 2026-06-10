with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "heroDetailTab === 'builds'" in line:
        # Print next 60 lines
        for j in range(idx, min(idx + 60, len(lines))):
            print(f"{j+1}: {lines[j].strip()}")
        break
