import csv, json, sys
sys.stdout.reconfigure(encoding='utf-8')

INPUT_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'
RESULTS_FILE = r'C:\Projects\aerojet-academy\scripts\easa-seed\m1_advanced_results.json'

with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
    results = json.load(f)

applied = 0
for idx_str, (answer, reason) in results.items():
    idx = int(idx_str)
    rows[idx]['correctAnswer'] = answer
    rows[idx]['reviewNote'] = reason
    rows[idx]['status'] = 'REVIEWED'
    applied += 1

print(f"Applied {applied} answers")

with open(INPUT_CSV, 'w', encoding='utf-8', newline='') as f:
    fieldnames = list(rows[0].keys())
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print("CSV updated")

# Count remaining
remaining = sum(1 for r in rows if not r.get('correctAnswer', '').strip())
print(f"Remaining unanswered: {remaining}")
