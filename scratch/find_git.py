import os
import subprocess

search_dirs = [
    r"C:\Users\rosha\AppData\Local\GitHubDesktop",
    r"C:\Users\rosha\AppData\Local\Programs",
    r"C:\Users\rosha\AppData\Local\Atlassian", # SourceTree
    r"C:\Program Files",
    r"C:\Program Files (x86)"
]

found_git = None
for s_dir in search_dirs:
    if not os.path.exists(s_dir):
        continue
    print(f"Scanning {s_dir}...")
    for root, dirs, files in os.walk(s_dir):
        if "git.exe" in files:
            p = os.path.join(root, "git.exe")
            # Avoid build outputs or test assets, look for cmd or bin folder
            if "cmd" in root or "bin" in root:
                print(f"Found git at: {p}")
                found_git = p
                break
    if found_git:
        break

if found_git:
    try:
        res = subprocess.run([found_git, "checkout", "src/App.jsx"], cwd=r"c:\Users\rosha\Documents\MLBB", capture_output=True, text=True)
        print("Git checkout output:", res.stdout, res.stderr)
        if res.returncode == 0:
            print("Successfully restored App.jsx using git!")
        else:
            print("Git failed to restore App.jsx")
    except Exception as e:
        print("Error running git:", e)
else:
    print("git.exe was not found anywhere in search dirs.")
