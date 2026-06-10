import os

target_text = "mengerikan dari Franco"

found = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '.idea' in root or '.system_generated' in root:
        continue
    for file in files:
        if file.endswith('.json') or file.endswith('.js') or file.endswith('.py'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if target_text in content:
                    found.append(path)
            except:
                pass

print(f"Found target text in files: {found}")
