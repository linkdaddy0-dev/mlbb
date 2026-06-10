import json

with open("src/data/fallback_roster.json", "r", encoding="utf-8") as f:
    roster = json.load(f)

for name in ["Alice", "Freya"]:
    matches = [h for h in roster if h["name"].lower() == name.lower()]
    print(f"Roster search for '{name}': {matches}")
