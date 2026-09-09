import csv
import os

# Load CSV
with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

# Build answer key from ANSWERS MODULE 02 QUESTIONS BANK BySFoS 2.txt
# Format: "1. * 21. C 41. A 61. A 81. B" etc.
# This maps question numbers to answer letters for the BySFoS question bank
answer_key = {}
ans_path = 'doc-text/M2/ANSWERS MODULE 02 QUESTIONS BANK BySFoS 2.txt'
with open(ans_path, 'r', encoding='utf-8') as f:
    content = f.read()
import re
# Find all "N. X" patterns where N is a number and X is a letter or *
for m in re.finditer(r'(\d+)\.\s*([A-C]|\*)', content):
    num = int(m.group(1))
    ans = m.group(2)
    answer_key[num] = ans

print("Answer key entries:", len(answer_key))

# The BySFoS question bank has questions 1-100. The CSV rows from that source
# have rawJson containing the question number. Let's map them.
# First, let's identify which CSV rows come from the BySFoS source.
bysfos_rows = []
other_rows = []
for r in rows:
    src = r.get('sourceFile', '')
    if 'BySFoS' in src:
        bysfos_rows.append(r)
    else:
        other_rows.append(r)

print(f"BySFoS rows: {len(bysfos_rows)}, Other rows: {len(other_rows)}")

# For BySFoS rows, extract question number from rawJson
def extract_qnum(raw_json):
    m = re.search(r'(\d+)\.\s', raw_json)
    if m:
        return int(m.group(1))
    return None

updated = 0
for r in bysfos_rows:
    if r.get('correctAnswer', '').strip():
        continue
    raw = r.get('rawJson', '')
    qnum = extract_qnum(raw)
    if qnum and qnum in answer_key:
        ans = answer_key[qnum]
        if ans == '*':
            continue  # skip starred (no clear answer)
        r['correctAnswer'] = ans
        r['reviewNote'] = f'Answered from BySFoS answer key Q{qnum}'
        updated += 1

print(f"Updated {updated} from BySFoS answer key")

# Write back
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