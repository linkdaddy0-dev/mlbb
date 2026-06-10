import os

workspace_dir = r"c:\Users\rosha\Documents\MLBB"
for root, dirs, files in os.walk(workspace_dir):
    if "node_modules" in root or ".git" in root or "dist" in root or "logs" in root or ".gemini" in root or ".idea" in root:
        continue
    for f in files:
        if f.endswith('.py') or f.endswith('.sql') or f.endswith('.js') or f.endswith('.jsx') or f.endswith('.json'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                try:
                    content = file.read()
                    if 'bestPick' in content or 'banPriority' in content or 'getCombatProfile' in content:
                        print(f"Match found in: {os.path.relpath(path, workspace_dir)}")
                except Exception as e:
                    pass
