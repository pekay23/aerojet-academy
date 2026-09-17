import csv, json, sys
sys.stdout.reconfigure(encoding='utf-8')

INPUT_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'

with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

for i, row in enumerate(rows[:40]):
    if not row.get('correctAnswer', '').strip():
        try:
            raw = json.loads(row.get('rawJson', '{}'))
            raw_text = raw.get('raw', '')
            print(f"Row {i}: {raw_text[:300]}")
            print()
        except Exception as e:
            print(f"Row {i}: ERROR - {e}")
