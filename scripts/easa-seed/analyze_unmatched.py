
import csv
with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unmatched = [r for r in rows if r.get('status', '') == 'NEEDS_ANSWER']
print('Unmatched:', len(unmatched))
for r in unmatched[:20]:
    print('- [', r.get('syllabusRef', ''), ']', r['text'][:90])
    print('  A:', r.get('optionA', '')[:60])
    print('  B:', r.get('optionB', '')[:60])
    print('  C:', r.get('optionC', '')[:60])
    d = r.get('optionD', '')
    if d:
        print('  D:', d[:60])
    print()
