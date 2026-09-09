import sys
sys.stdout.reconfigure(encoding='utf-8')
import re

# Load easa book text
with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\easa_book_full.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Search for question text that includes options
# Pattern: text containing "a)" "b)" "c)" options
option_pattern = re.compile(r'(.{20,500}\n[a-c]\)\s+.+?\n[a-c]\)\s+.+?\n[a-c]\)\s+.+)', re.DOTALL)
matches = list(option_pattern.finditer(text))
print(f"Question blocks with options found: {len(matches)}")
for m in matches[:20]:
    qtext = m.group(0).strip()
    qtext = re.sub(r'\n', ' | ', qtext)
    print(f"  {qtext[:300]}")
    print()

# Also search for questions that ask "What" "Which" "How" etc. followed by options
question_words = ['What', 'Which', 'How', 'When', 'Why', 'Where', 'If', 'The', 'In']
question_blocks = []
lines = text.split('\n')
for i, line in enumerate(lines):
    line = line.strip()
    if len(line) > 10 and (line.startswith('(') or re.match(r'^[a-c]\)', line.strip()[:3]) or 
        (line.endswith('?') and i+1 < len(lines) and re.match(r'^[a-c]\)', lines[i+1].strip()[:3]))):
        # This might be a question line
        context = '\n'.join(lines[max(0,i-2):i+5])
        if 'answer' not in context.lower():
            question_blocks.append(context.strip())

print(f"\n=== Potential question blocks: {len(question_blocks)} ===")
for block in question_blocks[:30]:
    print(f"  {block[:200]}")
    print()
