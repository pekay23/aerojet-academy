import csv
import os
import re

# Load CSV
with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

# Parse the "WITH ANSWERS" doc-text file for exact question-answer matches
def parse_with_answers(path):
    results = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    lines = content.split('\n')
    i = 0
    current_q = None
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('---') or 'Page' in line or 'P age' in line:
            i += 1
            continue
        if line and line[0].isdigit():
            parts = line.split('. ', 1)
            if len(parts) == 2 and parts[0].strip().isdigit():
                current_q = parts[1].strip()
                i += 1
                continue
        if current_q and line:
            low = line.lower().strip()
            if '*' in line:
                if low.startswith('a.') or low.startswith('a ') or low.startswith('- a'):
                    results.append((current_q, 'A'))
                elif low.startswith('b.') or low.startswith('b ') or low.startswith('- b'):
                    results.append((current_q, 'B'))
                elif low.startswith('c.') or low.startswith('c ') or low.startswith('- c'):
                    results.append((current_q, 'C'))
                current_q = None
        i += 1
    return results

# Load all doc-text answers
all_doc_answers = []
for fname in sorted(os.listdir('doc-text/M2')):
    if fname.endswith('.txt'):
        path = os.path.join('doc-text/M2', fname)
        entries = parse_with_answers(path)
        all_doc_answers.extend(entries)

print(f"Total doc-text answer entries: {len(all_doc_answers)}")

# Now match against CSV questions
def find_doc_answer(csv_text):
    ct = csv_text.strip().lower()
    for q, a in all_doc_answers:
        ql = q.strip().lower()
        if ct in ql or ql in ct:
            return a
        if len(ct) > 40 and len(ql) > 40 and ct[:40] == ql[:40]:
            return a
    return None

# Apply doc-text answers
updated = 0
unanswered = [r for r in rows if not r.get('correctAnswer', '').strip()]
for r in unanswered:
    txt = r.get('text', '').strip()
    if not txt:
        continue
    ans = find_doc_answer(txt)
    if ans:
        r['correctAnswer'] = ans
        r['reviewNote'] = 'Answered from doc-text matching'
        updated += 1

print(f"Updated {updated} from doc-text matching")

# Write intermediate result
with open('csvs_answered/M2.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

# Verify
with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows2 = list(reader)
unanswered2 = [r for r in rows2 if not r.get('correctAnswer', '').strip()]
print(f"Remaining unanswered: {len(unanswered2)}")