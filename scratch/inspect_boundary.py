with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(7325, 7350):
    print(f"{idx+1}: {lines[idx].strip()}")
