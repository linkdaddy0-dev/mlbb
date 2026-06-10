import json

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx in [128, 129, 130, 131]:
            data = json.loads(line)
            print(f"=== STEP {idx} (type={data.get('type')}) ===")
            content = data.get('content', '')
            print(content[:2000])
            if len(content) > 2000:
                print("... [TRUNCATED] ...")
            print("=" * 60)
