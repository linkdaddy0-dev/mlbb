import os

search_dir = r"c:\Users\rosha\Documents\MLBB"
print(f"Scanning {search_dir} for App.jsx backups...")
found = []
for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or ".git" in root or "dist" in root:
        continue
    for f in files:
        if "App" in f or "backup" in f or f.endswith(".bak") or f.endswith(".old") or f.endswith(".tmp"):
            p = os.path.join(root, f)
            print(f"Found: {p} ({os.path.getsize(p)} bytes)")
            found.append(p)

if not found:
    print("No backups found in workspace.")
