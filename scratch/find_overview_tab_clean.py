with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(8100, min(len(lines), 8325)):
    line = lines[idx]
    if 'overview' in line or 'overview-tab' in line:
        print(f"Line {idx+1}: {line.strip()}")
