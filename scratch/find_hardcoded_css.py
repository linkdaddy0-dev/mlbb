import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Match hex colors #fff, #ffffff, etc. and rgb/rgba colors NOT inside var(--...)
hex_pattern = re.compile(r'#([0-9a-fA-F]{3,8})\b')
rgba_pattern = re.compile(r'rgba?\([^)]+\)')

ignored_lines = [':root', 'border: 1.5px solid white', 'border: 1px solid white']

for idx, line in enumerate(lines):
    # Skip comments
    if line.strip().startswith('/*') or line.strip().startswith('*'):
        continue
    if any(ig in line for ig in ignored_lines):
        continue
    
    hex_matches = hex_pattern.findall(line)
    rgba_matches = rgba_pattern.findall(line)
    
    # Filter out rgba if it contains var
    rgba_filtered = [m for m in rgba_matches if 'var(' not in m]
    
    if hex_matches or rgba_filtered:
        print(f"Line {idx+1}: {line.strip()[:100]}")
