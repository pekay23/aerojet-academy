import csv, os, re

with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

# Parse doc-text files for answers
def parse_doc(path):
    results = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    lines = content.split('\n')
    current_q = None
    for line in lines:
        line = line.strip()
        if line.startswith('---') or 'Page' in line or 'P age' in line:
            continue
        if line and line[0].isdigit() and '. ' in line[:6]:
            parts = line.split('. ', 1)
            if len(parts) == 2 and parts[0].strip().isdigit():
                current_q = parts[1].strip()
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
    return results

all_doc = []
for fn in sorted(os.listdir('doc-text/M2')):
    if fn.endswith('.txt'):
        all_doc.extend(parse_doc(os.path.join('doc-text/M2', fn)))

print(f"Doc entries: {len(all_doc)}")

def find_ans(csv_text):
    ct = csv_text.strip().lower()
    for q, a in all_doc:
        ql = q.strip().lower()
        if ct in ql or ql in ct:
            return a
        if len(ct) > 40 and len(ql) > 40 and ct[:40] == ql[:40]:
            return a
    return None

updated = 0
for r in rows:
    if r.get('correctAnswer', '').strip():
        continue
    txt = r.get('text', '').strip()
    if not txt:
        continue
    ans = find_ans(txt)
    if ans:
        r['correctAnswer'] = ans
        r['reviewNote'] = 'Answered from doc-text matching'
        updated += 1

print(f"Updated: {updated}")

with open('csvs_answered/M2.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows2 = list(reader)
unans = [r for r in rows2 if not r.get('correctAnswer', '').strip()]
print(f"Remaining: {len(unans)}")