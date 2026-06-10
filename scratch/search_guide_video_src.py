import os

search_dir = 'src'
found = []

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx') or file.endswith('.json'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if 'guide_video' in content:
                found.append(filepath)

print("Files containing 'guide_video':", found)
