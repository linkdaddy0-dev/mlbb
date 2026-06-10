import json

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"
out_path = r"c:\Users\rosha\Documents\MLBB\scratch\step_280.txt"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx == 280:
            data = json.loads(line)
            content = data.get('content', '')
            with open(out_path, 'w', encoding='utf-8') as out_f:
                out_f.write(content)
            print(f"Successfully wrote Step 280 content to {out_path}")
            break
