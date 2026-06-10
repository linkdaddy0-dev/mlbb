bundle_path = r"c:\Users\rosha\Documents\MLBB\android\app\src\main\assets\public\assets\index-BTS8TsJo.js"

with open(bundle_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for the function ending with "})(x,ue,re)" or similar in the bundle
target = '})(x,ue,re)'
pos = content.find(target)
if pos != -1:
    print("Found target at position:", pos)
    # Search backwards for the function start
    # It probably starts with "const something = ((x, ue, re) =>" or "((x, ue, re) => {"
    # Let's extract 6000 characters before the target
    start = max(0, pos - 6000)
    end = pos + len(target)
    with open(r"c:\Users\rosha\Documents\MLBB\scratch\extracted_iife.txt", 'w', encoding='utf-8') as out_f:
        out_f.write(content[start:end])
    print("Wrote extracted section to scratch/extracted_iife.txt")
else:
    print("Target not found.")
