with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'verdict =' in line or 'oData =' in line or 'verdict=' in line or 'oData=' in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 5 lines before
        start = max(0, idx-5)
        for j in range(start, idx+1):
            print(f"  {j+1}: {lines[j].strip()}")
