import json

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if 'verdict' in content.lower() or 'odata' in content.lower():
                # Ignore this python script itself in logs if it appears
                if 'search_log_raw.py' in content or 'inspect_original_vars.py' in content:
                    continue
                print(f"Step {idx}: content length={len(content)}")
                # Print occurrences of verdict and oData in content
                pos = content.lower().find('verdict')
                if pos == -1:
                    pos = content.lower().find('odata')
                print(content[max(0, pos-150):pos+350])
                print("-" * 50)
        except Exception as e:
            pass
