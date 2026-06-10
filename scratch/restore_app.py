import json
import os

log_path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\e8fb97e7-dd0b-4c54-b658-59a6b16854e4\.system_generated\logs\transcript.jsonl"
app_path = r"c:\Users\rosha\Documents\MLBB\src\App.jsx"

if not os.path.exists(log_path):
    print("Log path does not exist!")
    exit(1)

# We want to find the first view of App.jsx or locate the original text
# We can also check if we can read the file as of git checkout, wait...
# Since git was not found, let's see if we can reconstruct the original from the views.
# But wait! Is there any git backup? Sometimes git is installed in a different path.
# Let's search the PATH or check if we can restore from logs first.

print("Reading logs...")
chunks = {}
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Find view_file tool output
            if data.get('type') == 'VIEW_FILE' or 'tool_calls' in data:
                # check if it is view_file of App.jsx
                tool_calls = data.get('tool_calls', [])
                for tc in tool_calls:
                    if tc.get('name') == 'view_file' and 'App.jsx' in tc.get('args', {}).get('AbsolutePath', ''):
                        # The output is in system or follow up message
                        pass
            # Let's also check for system output
            if 'content' in data and 'File Path: `file:///c:/Users/rosha/Documents/MLBB/src/App.jsx`' in data['content']:
                content = data['content']
                # extract lines
                lines = content.split('\n')
                print(f"Found view block in logs of size {len(lines)}")
                for l in lines:
                    if ': ' in l:
                        parts = l.split(': ', 1)
                        if len(parts) == 2 and parts[0].isdigit():
                            line_num = int(parts[0])
                            original_line = parts[1]
                            chunks[line_num] = original_line
        except Exception as e:
            pass

if not chunks:
    print("No chunks found in logs!")
    exit(1)

print(f"Reconstructed {len(chunks)} lines from logs.")
# Let's check which lines are missing
min_line = min(chunks.keys())
max_line = max(chunks.keys())
print(f"Line range: {min_line} to {max_line}")

# Let's read the current App.jsx
with open(app_path, 'r', encoding='utf-8') as f:
    current_lines = f.readlines()

print(f"Current App.jsx has {len(current_lines)} lines.")

# Reconstruct original lines
# Note that we only replaced from line 7091 to 8178 (or whatever lines in the original).
# Wait, let's verify if we can rewrite App.jsx by replacing the edited section back with the original chunks!
# What were the line numbers we replaced?
# We replaced from line 7091 to 8178 in the original file.
# The chunks from logs have original lines:
# 6841 to 9100.
# So we can fully restore the range 7091 to 8178!
# Let's build the original file contents:
restored_lines = []
# For lines below 7091, we keep the current lines of App.jsx (since we only edited lines 7091 onwards).
# Wait, did the line count drop from 10042 to 9047? Yes.
# So the current lines of App.jsx up to line 7090 are the same as original!
# Let's double check.
# Yes, we only modified from line 7091 onwards.
# So:
# - Lines 1 to 7090: take from current App.jsx (1-indexed, so 0 to 7089 in 0-indexed list)
# - Lines 7091 to 8178: take from our log chunks (since we have original lines 6841 to 9100 in log chunks!)
# - Lines 8179 onwards: wait, since the current file has lines after 8179 shifted down by ~1000, wait, did we edit after 8179?
# No, we did not edit after 8179 in the original file! But in the new file, those lines are at line 7182 onwards.
# So the lines in the original file from 8179 to 10042 are still present in the current App.jsx, but they start at line 7182 (which is 7181 in 0-indexed list)!
# Let's check:
# original lines 8179 to 10042 are equal to current lines 7182 to 9047!
# Let's verify: 9047 - 7182 = 1865 lines.
# 10042 - 8179 = 1863 lines.
# Yes! They match perfectly!

original_lines = []
# Lines 1 to 7090 (0-indexed 0 to 7089)
for idx in range(7090):
    original_lines.append(current_lines[idx])

# Lines 7091 to 8178 (0-indexed 7090 to 8177)
for line_num in range(7091, 8179):
    if line_num in chunks:
        # Re-add trailing newline since print split removed it
        original_lines.append(chunks[line_num] + '\n')
    else:
        print(f"Warning: line {line_num} not found in chunks!")

# Lines 8179 onwards (0-indexed 8178 to 10041)
# These are currently at line 7182 in current_lines (0-indexed 7181 onwards)
for idx in range(7181, len(current_lines)):
    original_lines.append(current_lines[idx])

with open(app_path, 'w', encoding='utf-8') as f:
    f.writelines(original_lines)

print("Restoration complete!")
