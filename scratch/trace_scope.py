# Let's search backwards from line 7575 (where verdict is used) to find any opening braces, functions, or variable declarations
with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

target_line = 7575
print(f"Tracing scope backwards from line {target_line}:")
for idx in range(target_line - 1, max(0, target_line - 400), -1):
    line = lines[idx].strip()
    if '(() =>' in line or 'function' in line or 'const ' in line or 'let ' in line or 'var ' in line:
        # Check if it has variables we care about or if it's an IIFE start
        print(f"Line {idx+1}: {line}")
