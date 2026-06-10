import os

scratch_dir = r"c:\Users\rosha\Documents\MLBB\scratch"
for f in os.listdir(scratch_dir):
    path = os.path.join(scratch_dir, f)
    if os.path.isfile(path) and f != 'search_scratch_spikes.py':
        with open(path, 'r', encoding='utf-8', errors='ignore') as file:
            try:
                content = file.read()
                if 'spikes' in content or 'verdict' in content or 'odata' in content.lower():
                    print(f"Match found in scratch file: {f}")
            except Exception as e:
                pass
