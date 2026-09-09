import csv, json, sys

with open('scripts/easa-seed/csvs_answered/M1.csv', 'r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    records = list(reader)

total = len(records)
unanswered = []
for i, r in enumerate(records):
    ca = (r.get('correctAnswer','') or '').strip()
    if not ca or ca == 'NEEDS_ANSWER':
        unanswered.append((i, r))

print('Total:', total)
print('Unanswered:', len(unanswered))

with open('scripts/easa-seed/unanswered_m1.json', 'w', encoding='utf-8') as f:
    out = []
    for i, r in unanswered:
        out.append({
            'rowIndex': i,
            'module': r.get('module',''),
            'syllabusRef': r.get('syllabusRef',''),
            'level': r.get('level',''),
            'text': r.get('text',''),
            'optionA': r.get('optionA',''),
            'optionB': r.get('optionB',''),
            'optionC': r.get('optionC',''),
            'optionD': r.get('optionD',''),
            'correctAnswer': r.get('correctAnswer',''),
            'difficulty': r.get('difficulty',''),
            'subTopic': r.get('subTopic',''),
            'sourceFile': r.get('sourceFile',''),
            'reviewNote': r.get('reviewNote',''),
            'rawJson': r.get('rawJson',''),
        })
    json.dump(out, f, ensure_ascii=False, indent=2)

print("Wrote unanswered_m1.json")
