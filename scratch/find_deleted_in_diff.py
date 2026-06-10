with open(r"c:\Users\rosha\Documents\MLBB\scratch\step_129_diff.txt", 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Searching deleted lines in diff for verdict or oData:")
for idx, line in enumerate(lines):
    if line.startswith("-") and ('verdict' in line or 'oData' in line or 'odata' in line.lower()):
        print(f"Line {idx+1}: {line.strip()}")
