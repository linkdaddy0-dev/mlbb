import re

bundle_path = r"c:\Users\rosha\Documents\MLBB\android\app\src\main\assets\public\assets\index-BTS8TsJo.js"

with open(bundle_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for the string patterns around verdict and oData
print("Searching for 'verdict' in bundle:")
for match in re.finditer(r'verdict', content, re.IGNORECASE):
    start = max(0, match.start() - 200)
    end = min(len(content), match.end() + 200)
    print(content[start:end])
    print("-" * 50)

print("\nSearching for 'oData' in bundle:")
for match in re.finditer(r'oData', content):
    start = max(0, match.start() - 200)
    end = min(len(content), match.end() + 200)
    print(content[start:end])
    print("-" * 50)
