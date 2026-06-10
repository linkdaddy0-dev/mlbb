with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "activeTab === 'rankings'" in line:
        for j in range(idx, min(idx + 100, len(lines))):
            print(f"{j+1}: {lines[j].strip()[:120]}")
        break
