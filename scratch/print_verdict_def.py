with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if idx >= 7450 and idx <= 8300:
        if 'verdict' in line or 'oData' in line:
            print(f"Match on line {idx+1}: {line.strip()}")
            # print 15 lines before
            start = max(0, idx - 15)
            for j in range(start, idx+1):
                print(f"  {j+1}: {lines[j].strip()}")
            print("=" * 40)
