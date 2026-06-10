import os
import json
import re

# Common Indonesian stop words that would easily identify Indonesian text
id_words = re.compile(r'\b(yang|adalah|dengan|untuk|dari|tidak|akan|tim|umumnya|berhasil|menarik|lawan|tertarik|tersebut|hanya|saja|bila|tim|teman|mengerikan|adalah|bisa|atau|dan|dalam|pada|juga|saya|kami|mereka|dia|ia|kamu|anda|kita)\b', re.IGNORECASE)

guide_dir = r".\public\data\patches\1.8.84\en\heroes"
if not os.path.exists(guide_dir):
    for root, dirs, files in os.walk('.'):
        if 'patches' in root and '1.8.84' in root and 'en' in root and root.endswith('heroes'):
            guide_dir = root
            break

print(f"Scanning directory: {guide_dir}")
found_non_english = []

def scan_value(val, path, key_path=""):
    if isinstance(val, str):
        matches = id_words.findall(val)
        if len(matches) >= 2: # At least 2 matches to avoid false positives on short words
            found_non_english.append({
                "file": os.path.basename(path),
                "key_path": key_path,
                "text": val,
                "matches": list(set(matches))
            })
    elif isinstance(val, dict):
        for k, v in val.items():
            scan_value(v, path, f"{key_path}.{k}" if key_path else k)
    elif isinstance(val, list):
        for idx, item in enumerate(val):
            scan_value(item, path, f"{key_path}[{idx}]")

for file in os.listdir(guide_dir):
    if file.endswith('.json'):
        filepath = os.path.join(guide_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        scan_value(data, filepath)

print(f"Found {len(found_non_english)} non-English entries.")
for idx, entry in enumerate(found_non_english):
    print(f"{entry['file']} @ {entry['key_path']}: {entry['text'][:120]}...")
