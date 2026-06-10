import json
import os

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log not found.")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            # Print steps of type VIEW_FILE or steps with content containing "Original code"
            content = data.get('content', '')
            if 'original_line' in content or ' orijinal' in content or 'AbsolutePath' in str(data):
                print(f"Step {idx}: type={data.get('type')}, content length={len(content)}")
                # check if there is raw tool output
                if 'tool_calls' in data:
                    print("  Contains tool_calls:", [tc.get('name') for tc in data['tool_calls']])
        except Exception as e:
            pass
