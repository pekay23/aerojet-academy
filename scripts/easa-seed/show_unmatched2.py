
import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unmatched = [r for r in rows if r.get('status', '') == 'NEEDS_ANSWER']
print('Remaining NEEDS_ANSWER:', len(unmatched))
for r in unmatched:
    print(f"[{r.get('syllabusRef', '')}] {r['text'][:120]}")
    print(f"  Note: {r.get('reviewNote', '')}")
    print()
