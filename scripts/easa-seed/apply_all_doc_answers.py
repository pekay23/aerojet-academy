import csv
import os
import re

# Load CSV
with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

# Strategy 1: Parse the "WITH ANSWERS" doc-text file for exact question-answer matches
# The file "AEROJET M2 SAMPLE SET 10 WITH ANSWERS R.txt" has questions with * marked answers
def parse_with_answers(path):
    """Parse doc-text file, return list of (question_text, answer_letter)."""
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

# Strategy 2: Apply the "Answers 2023-05-16 07_50_48.txt" answer key
# This file has answers for sample sets. Let's figure out which source files it covers.
# The answer key has 101 entries. Let's count questions per source file.
ans_key_path = 'doc-text/M2/Answers 2023-05-16 07_50_48.txt'
with open(ans_key_path, 'r', encoding='utf-8') as f:
    ans_lines = [l.strip() for l in f.readlines() if l.strip()]
# Skip "Answers" header, first entry is Q1
ans_entries = []
for line in ans_lines[1:]:  # skip "Answers" header
    if line == '*':
        ans_entries.append('*')
    elif line in ('A', 'B', 'C'):
        ans_entries.append(line)
print(f"Answer key entries: {len(ans_entries)}")

# Count questions per source file in CSV
from collections import Counter
src_counts = Counter()
for r in rows:
    src_counts[r.get('sourceFile', '')] += 1
print("Source file counts:", dict(src_counts))

# The answer key likely covers the "WITHOUT ANSWER" sample sets.
# Let's map: for each unanswered row, try to find a match by question text similarity
def find_doc_answer(csv_text):
    """Find matching answer from doc-text files."""
    ct = csv_text.strip().lower()
    for q, a in all_doc_answers:
        ql = q.strip().lower()
        # Try matching key phrases
        if ct in ql or ql in ct:
            return a
        # Try first 40 chars
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