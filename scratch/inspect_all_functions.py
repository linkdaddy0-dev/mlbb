import re

with open(r"c:\Users\rosha\Documents\MLBB\src\App.jsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Find top-level functions/constants declarations
# e.g., const getXXX = ... or function getXXX
matches_const = re.findall(r"const\s+(\w+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>", content)
matches_func = re.findall(r"function\s+(\w+)", content)

print("Top-level const arrow functions:")
for m in sorted(list(set(matches_const))):
    if m.startswith('get') or 'Hero' in m or 'Item' in m:
        print(f"  {m}")

print("\nTop-level standard functions:")
for m in sorted(list(set(matches_func))):
    print(f"  {m}")
