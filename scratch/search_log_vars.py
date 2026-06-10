import json

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            content = str(data)
            if 'const verdict =' in content or 'let verdict =' in content or 'const oData =' in content or 'let oData =' in content or 'const verdict =' in content:
                print(f"Match in Step {idx}:")
                # find where 'verdict =' or 'oData =' is in the content
                pos = content.find('verdict =')
                if pos == -1:
                    pos = content.find('oData =')
                print(content[max(0, pos-100):pos+500])
                print("=" * 60)
        except Exception as e:
            pass
