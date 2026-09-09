
import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unmatched = [r for r in rows if r.get('status', '') == 'NEEDS_ANSWER']
print(f'Remaining NEEDS_ANSWER: {len(unmatched)}')
for idx, r in enumerate(unmatched):
    print(f'\n--- Q{idx+1} [{r.get("syllabusRef", "")}] ---')
    print(f"Text: {r['text']}")
    print(f"A: {r.get('optionA', '')}")
    print(f"B: {r.get('optionB', '')}")
    c = r.get('optionC', '')
    if c: print(f"C: {c}")
    d = r.get('optionD', '')
    if d: print(f"D: {d}")
