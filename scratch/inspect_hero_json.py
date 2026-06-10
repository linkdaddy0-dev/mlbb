import json

with open(r"c:\Users\rosha\Documents\MLBB\src\data\fallback_heroes.json", 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print keys and first hero sample
print("Type of data:", type(data))
if isinstance(data, list) and len(data) > 0:
    print("Keys of first hero:", data[0].keys())
    print("Sample hero:", json.dumps(data[0], indent=2))
elif isinstance(data, dict):
    print("Keys of dict:", data.keys())
    first_key = list(data.keys())[0]
    print(f"Sample hero for key '{first_key}':", json.dumps(data[first_key], indent=2))
