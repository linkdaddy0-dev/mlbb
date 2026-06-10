with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'setDetailHeroData' in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 5 lines before and after
        for j in range(max(0, idx-5), min(len(lines), idx + 10)):
            print(f"  {j+1}: {lines[j].strip()}")
