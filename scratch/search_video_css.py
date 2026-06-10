with open('src/index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'video-lite' in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
