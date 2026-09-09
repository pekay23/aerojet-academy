
import csv

CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'

final_answers = [
    ('typical deflection range for the rudder in a rudder servo', 'B', '+/-25° per Suntech Fig 03.29'),
    ('typical rudder deflection range in a Yaw Damper Servo', 'B', '+/-3-6° per Suntech Fig 03.30'),
    ('typical relative density range for the electrolyte in a Ni/Cd', 'A', '1.200-1.250 per Suntech (actual 1.240-1.300)'),
]

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

answered = 0
needs = 0
results = []

for row in rows:
    if row.get('correctAnswer', '').strip():
        answered += 1
        results.append(row)
        continue
    
    q = row.get('text', '').strip()
    found = False
    
    for key, letter, note in final_answers:
        if key.lower() in q.lower():
            row['correctAnswer'] = letter
            row['reviewNote'] = note
            row['aiConfidence'] = 'HIGH'
            row['status'] = 'ANSWERED'
            answered += 1
            found = True
            break
    
    if not found:
        row['reviewNote'] = 'NEEDS_ANSWER - ambiguous or insufficient context'
        row['status'] = 'NEEDS_ANSWER'
        needs += 1
    
    results.append(row)

with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print(f'Results: Answered={answered}, NEEDS_ANSWER={needs}, Total={len(rows)}')

# Final verification
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows2 = list(reader)

answered_final = sum(1 for r in rows2 if r.get('correctAnswer', '').strip())
needs_final = sum(1 for r in rows2 if r.get('status', '') == 'NEEDS_ANSWER')
print(f'Final verification: Answered={answered_final}, NEEDS_ANSWER={needs_final}, Total={len(rows2)}')
