import csv, sys
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

with open('csvs_answered/M1.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f'Total rows: {len(rows)}')
empty = [r for r in rows if not r.get('correctAnswer','').strip()]
print(f'Empty correctAnswer: {len(empty)}')
needs = [r for r in rows if r.get('status','').strip() == 'NEEDS_ANSWER']
print(f'NEEDS_ANSWER status: {len(needs)}')

src = Counter(r.get('sourceFile','') for r in empty)
for s, c in src.most_common():
    print(f'{c:4d} {s}')

print('\n--- First 20 unanswered ---')
for r in empty[:20]:
    text = r['text'].replace('\n',' ')[:100]
    opts = [r.get('optionA',''), r.get('optionB',''), r.get('optionC',''), r.get('optionD','')]
    opts = [o for o in opts if o]
    print(f"Q: {text}")
    print(f"  A: {opts}")
    print()
