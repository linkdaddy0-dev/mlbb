import os

src_dir = r"c:\Users\rosha\Documents\MLBB\src"
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.js') or f.endswith('.jsx') or f.endswith('.json'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                try:
                    content = file.read()
                    if 'spikes' in content or 'verdict' in content:
                        print(f"Match found in: {os.path.relpath(path, src_dir)}")
                except Exception as e:
                    pass
