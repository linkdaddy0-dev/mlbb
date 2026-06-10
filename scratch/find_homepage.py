import os

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for the homepage tabs or rendering section
# Look for where activeTab == 'home' is evaluated in JSX
lines = content.split('\n')
for idx, line in enumerate(lines):
    if "activeTab === 'home'" in line or 'activeTab === "home"' in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
        # Print a few lines around it to understand the context
        for j in range(max(0, idx-5), min(len(lines), idx+15)):
            print(f"  {j+1}: {lines[j][:100]}")
        print("-" * 50)
