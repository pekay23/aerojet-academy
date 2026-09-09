import csv, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    answered = [row for row in reader if row.get('correctAnswer','').strip()]
print(f'Total answered: {len(answered)}')
for row in answered[:15]:
    text = row['text'][:60].replace('\n',' ')
    note = row['reviewNote'][:60].replace('\n',' ')
    print(f"Q: {text}... A: {row['correctAnswer']} Note: {note}...")
