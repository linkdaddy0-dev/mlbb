import json
import os

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if 'selectedHero && (' in content:
                print(f"Match in content of Step {idx} (length={len(content)}):")
                # Find where selectedHero && ( is
                pos = content.find('selectedHero && (')
                print(content[pos:pos+500])
                print("-" * 50)
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    # search in arguments
                    args_str = str(tc.get('args', {}))
                    if 'selectedHero && (' in args_str:
                        print(f"Match in tool call arguments of Step {idx}:")
                        pos = args_str.find('selectedHero && (')
                        print(args_str[pos:pos+500])
                        print("-" * 50)
        except Exception as e:
            pass
