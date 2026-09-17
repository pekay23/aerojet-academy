
import csv, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'
CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    corpus_text = '\n'.join(json.loads(line).get('text', '') for line in f if line.strip()).lower()

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

# For each unmatched question, search corpus for each option
unmatched = [r for r in rows if r.get('status', '') == 'NEEDS_ANSWER']
print(f'Unmatched before targeted search: {len(unmatched)}')

for row in unmatched:
    q = row.get('text', '').strip()
    opts = [row.get('optionA', '').strip(), row.get('optionB', '').strip(),
            row.get('optionC', '').strip(), row.get('optionD', '').strip()]
    opts = [o for o in opts if o]
    
    for i, opt in enumerate(opts):
        opt_clean = re.sub(r'[^a-zA-Z0-9\s]', '', opt.lower()).strip()
        if len(opt_clean) > 10 and opt_clean in corpus_text:
            row['correctAnswer'] = chr(65 + i)
            row['reviewNote'] = 'Matched from corpus (targeted option search)'
            row['aiConfidence'] = 'MEDIUM'
            row['status'] = 'ANSWERED'
            print(f"MATCHED: {q[:80]} -> {chr(65 + i)}")
            break

# Write back
with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows2 = list(reader)

still_unmatched = sum(1 for r in rows2 if r.get('status', '') == 'NEEDS_ANSWER')
print(f'Still NEEDS_ANSWER after targeted search: {still_unmatched}')
