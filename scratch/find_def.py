import re

app_path = r"c:\Users\rosha\Documents\MLBB\src\App.jsx"
with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def print_around(pattern, limit=10):
    count = 0
    for idx, line in enumerate(lines):
        if re.search(pattern, line):
            print(f"--- Match found on line {idx+1} ---")
            start = max(0, idx - 5)
            end = min(len(lines), idx + 15)
            for j in range(start, end):
                print(f"{j+1}: {lines[j].strip()}")
            count += 1
            if count >= limit:
                break

print("Checking selectedHero state declaration:")
print_around(r"const\s+\[\s*selectedHero")

print("\nChecking detailHeroData state declaration:")
print_around(r"const\s+\[\s*detailHeroData")
