import csv, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

INPUT_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'
OUTPUT = r'C:\Projects\aerojet-academy\scripts\easa-seed\batch_websearch_m1.json'

with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = []
for i, row in enumerate(rows):
    if not row.get('correctAnswer', '').strip():
        text = row['text'].replace('\n', ' ').strip()
        opts = [row.get('optionA', ''), row.get('optionB', ''), row.get('optionC', ''), row.get('optionD', '')]
        opts = [o for o in opts if o]
        unanswered.append({
            'row_index': i,
            'id': i + 1,
            'text': text,
            'options': opts,
            'source': row.get('sourceFile', ''),
            'difficulty': row.get('difficulty', ''),
        })

# Group by source for batch processing
from collections import defaultdict
by_source = defaultdict(list)
for q in unanswered:
    by_source[q['source']].append(q)

print(f"Total unanswered: {len(unanswered)}")
print("\n=== BATCHES BY SOURCE ===")
batch_num = 0
batches = []
for src, qs in sorted(by_source.items(), key=lambda x: -len(x[1])):
    batch_num += 1
    batches.append({'source': src, 'questions': qs})
    print(f"\n--- Batch {batch_num}: {src} ({len(qs)} questions) ---")
    for q in qs:
        opts_str = ' | '.join(q['options'])
        print(f"  Q{q['id']}: {q['text'][:100]}")
        print(f"       [{opts_str}]")

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(batches, f, indent=2, ensure_ascii=False)

print(f"\nSaved {batch_num} batches to {OUTPUT}")
