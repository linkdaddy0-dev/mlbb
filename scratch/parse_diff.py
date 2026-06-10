import os

diff_path = r"c:\Users\rosha\Documents\MLBB\scratch\step_129_diff.txt"
out_path = r"c:\Users\rosha\Documents\MLBB\scratch\reconstructed_original.jsx"

if not os.path.exists(diff_path):
    print("Diff file not found!")
    exit(1)

with open(diff_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

reconstructed = []
for line in lines:
    if line.startswith("-"):
        # Remove the leading "-" and keep the rest
        # We need to make sure we don't remove lines that are just "-"
        reconstructed.append(line[1:])
    elif line.startswith(" "):
        # Keep context lines as well to see structure
        reconstructed.append(line[1:])

with open(out_path, 'w', encoding='utf-8') as f:
    f.writelines(reconstructed)

print(f"Reconstructed original code written to {out_path} ({len(reconstructed)} lines)")
