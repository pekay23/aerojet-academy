
import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unmatched = [r for r in rows if r.get('status', '') == 'NEEDS_ANSWER']
print('Remaining NEEDS_ANSWER:', len(unmatched))
for r in unmatched:
    print(f"[{r.get('syllabusRef', '')}] {r['text'][:100]}")
    print(f"  A: {r.get('optionA', '')[:70]}")
    print(f"  B: {r.get('optionB', '')[:70]}")
    c = r.get('optionC', '')
    if c:
        print(f"  C: {c[:70]}")
    d = r.get('optionD', '')
    if d:
        print(f"  D: {d[:70]}")
    print()
