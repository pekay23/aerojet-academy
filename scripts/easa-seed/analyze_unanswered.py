import csv, sys, json, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = [r for r in rows if not r.get('correctAnswer','').strip()]
print(f'Total unanswered: {len(unanswered)}')

# Show all unique sources
from collections import Counter
src = Counter(r.get('sourceFile','') for r in unanswered)
for s, c in src.most_common():
    print(f'{c:4d} {s}')

# Show first 20 unanswered questions
print('\n--- First 20 unanswered ---')
for r in unanswered[:20]:
    text = r['text'].replace('\n',' ')[:100]
    opts = [r.get('optionA',''), r.get('optionB',''), r.get('optionC',''), r.get('optionD','')]
    opts = [o for o in opts if o]
    print(f"Q: {text}")
    print(f"  A: {opts}")
    print()
