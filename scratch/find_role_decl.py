with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'const role ' in line or 'let role ' in line or 'const lane ' in line or 'const role =' in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 5 lines before
        for j in range(max(0, idx-2), min(len(lines), idx + 6)):
            print(f"  {j+1}: {lines[j].strip()}")
