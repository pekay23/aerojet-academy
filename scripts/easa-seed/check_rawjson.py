import csv, json, sys, re, math
sys.stdout.reconfigure(encoding='utf-8')

INPUT_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'

with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Check rawJson for unanswered questions
for i, row in enumerate(rows):
    if not row.get('correctAnswer', '').strip():
        try:
            raw = json.loads(row.get('rawJson', '{}'))
            raw_text = raw.get('raw', '')
            if raw_text:
                print(f"Row {i}: {raw_text[:200]}")
                print(f"   Options: {raw.get('options', [])}")
                print()
        except:
            pass
        if i > 30:
            break
