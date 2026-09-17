import csv, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = [r for r in rows if not r.get('correctAnswer','').strip()]

# Write all unanswered questions to a file for analysis
with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\unanswered_m3.txt', 'w', encoding='utf-8') as f:
    for i, r in enumerate(unanswered, 1):
        f.write(f"=== Q{i} ===\n")
        f.write(f"Text: {r['text']}\n")
        f.write(f"A: {r.get('optionA','')}\n")
        f.write(f"B: {r.get('optionB','')}\n")
        f.write(f"C: {r.get('optionC','')}\n")
        f.write(f"D: {r.get('optionD','')}\n")
        f.write(f"Source: {r.get('sourceFile','')}\n")
        f.write(f"Syllabus: {r.get('syllabusRef','')}\n")
        f.write("\n")

print(f'Wrote {len(unanswered)} questions to unanswered_m3.txt')
