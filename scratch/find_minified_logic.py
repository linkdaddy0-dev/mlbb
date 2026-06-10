bundle_path = r"c:\Users\rosha\Documents\MLBB\android\app\src\main\assets\public\assets\index-BTS8TsJo.js"

with open(bundle_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('"META VERDICT"')
if pos != -1:
    print("Found 'META VERDICT' at position:", pos)
    start = max(0, pos - 15000)
    end = min(len(content), pos + 1000)
    with open(r"c:\Users\rosha\Documents\MLBB\scratch\extracted_minified.txt", 'w', encoding='utf-8') as out_f:
        out_f.write(content[start:end])
    print("Wrote extracted bundle section to scratch/extracted_minified.txt")
else:
    print("'META VERDICT' string not found in bundle.")
