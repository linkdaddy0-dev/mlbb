import json

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"

found = False
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            content = str(data)
            # Look for lines that assign verdict or oData
            if 'const verdict = ' in content or 'let verdict = ' in content or 'const oData = ' in content or 'let oData = ' in content:
                print(f"Match in Step {idx}:")
                # print around the match
                pos = content.find('verdict =')
                if pos == -1:
                    pos = content.find('oData =')
                print(content[max(0, pos-150):pos+600])
                print("-" * 60)
                found = True
        except Exception as e:
            pass

if not found:
    print("No matching step found.")
