with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'banRate' in line or 'verdict =' in line or 'oData =' in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 5 lines after
        for j in range(idx, min(len(lines), idx + 8)):
            print(f"  {j+1}: {lines[j].strip()}")
