import csv, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f'Total rows: {len(rows)}')
unanswered = [r for r in rows if not r.get('correctAnswer', '').strip()]
answered = [r for r in rows if r.get('correctAnswer', '').strip()]
print(f'Answered: {len(answered)}')
print(f'Unanswered: {len(unanswered)}')
print('---Unanswered questions---')
for i, r in enumerate(unanswered):
    sr = r.get('syllabusRef', '?')
    txt = r.get('text', '')[:120]
    a = r.get('optionA', '')
    b = r.get('optionB', '')
    c = r.get('optionC', '')
    d = r.get('optionD', '')
    src = r.get('sourceFile', '')
    print(f'{i+1}. [{sr}] {txt}')
    print(f'   A:{a} | B:{b} | C:{c} | D:{d}')
    print(f'   src:{src}')
    print()