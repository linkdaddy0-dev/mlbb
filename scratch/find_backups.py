import os

search_dir = r"C:\Users\rosha\.gemini"
print(f"Scanning {search_dir} for App.jsx backups...")
found = []
for root, dirs, files in os.walk(search_dir):
    for f in files:
        if f == "App.jsx" or "App_backup" in f or "App.jsx.bak" in f:
            p = os.path.join(root, f)
            print(f"Found: {p} ({os.path.getsize(p)} bytes)")
            found.append(p)

if not found:
    print("No backups found in .gemini directory.")
