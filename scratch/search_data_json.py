import os
import json

data_dir = r"c:\Users\rosha\Documents\MLBB\src\data"
for f in os.listdir(data_dir):
    if f.endswith('.json'):
        path = os.path.join(data_dir, f)
        with open(path, 'r', encoding='utf-8') as file:
            try:
                content = file.read()
                if 'bestPick' in content or 'banPriority' in content or 'spikes' in content:
                    print(f"Found match in file: {f}")
            except Exception as e:
                pass
