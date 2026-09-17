import csv, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = [r for r in rows if not r.get('correctAnswer','').strip()]
print(f'Unanswered: {len(unanswered)}')

# Show questions 20-50
for i, r in enumerate(unanswered[20:60], start=21):
    text = r['text'].replace('\n',' ')[:120]
    opts = [r.get('optionA',''), r.get('optionB',''), r.get('optionC',''), r.get('optionD','')]
    opts = [o for o in opts if o]
    print(f"{i:3d}. {text}")
    for j, o in enumerate(opts[:3]):
        print(f"     {chr(65+j)}) {o}")
    print()
