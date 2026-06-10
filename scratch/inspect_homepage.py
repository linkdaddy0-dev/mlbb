with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to extract lines 3016 to 3600 and check comments and section headers
section_content = []
collect = False
brace_count = 0
for idx in range(3015, len(lines)):
    line = lines[idx]
    
    # We can detect major comments like: {/* 1. Welcome Legend Profile Banner */} or {/* 2. ... */}
    # Or check keys in style or classes
    strip_line = line.strip()
    if '{/*' in strip_line and '*/}' in strip_line:
        section_content.append(f"Line {idx+1}: {strip_line}")
    elif 'className=' in strip_line:
        # Extract class name
        section_content.append(f"  Line {idx+1}: Class -> {strip_line[:100]}")
    elif 'activeTab ===' in strip_line and idx > 3100:
        # Found next tab
        break

print("\n".join(section_content))
