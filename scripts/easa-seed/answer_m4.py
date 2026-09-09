import json, csv, re

BASE = 'C:/Projects/aerojet-academy/scripts/easa-seed'

corpus = []
with open(f'{BASE}/corpus/M4.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        corpus.append(json.loads(line))

with open(f'{BASE}/doc-text/M4/M4 Standard EASA Exam.txt', 'r', encoding='utf-8') as f:
    doctext = f.read()

with open(f'{BASE}/csvs_answered/M4.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

print(f'Rows: {len(rows)}')

doc_lines = doctext.strip().split('\n')
doc_qa = []
cq = None; ct = None; co = []
for line in doc_lines:
    line = line.strip()
    if not line: continue
    m = re.match(r'^(\d+)\.\s+(.+)', line)
    if m:
        if cq is not None:
            doc_qa.append({'num': cq, 'text': ct, 'options': co})
        cq = m.group(1); ct = m.group(2); co = []
        continue
    m = re.match(r'^[a-c]\)\s+(.+)', line)
    if m and cq is not None:
        co.append(m.group(1).strip())
if cq is not None:
    doc_qa.append({'num': cq, 'text': ct, 'options': co})

print(f'Doc QA: {len(doc_qa)}')

matched = 0
unmatched = []
for i, row in enumerate(rows):
    qt = row['text']
    qc = re.sub(r'^[\d]+\.\s*', '', qt).strip()
    found = False
    for qa in doc_qa:
        if qa['text'].strip() == qc or qc.lower() in qa['text'].lower() or qa['text'].lower() in qc.lower():
            found = True; matched += 1; break
    if not found:
        unmatched.append((i, qt[:80]))

print(f'Matched: {matched}, Unmatched: {len(unmatched)}')
for u in unmatched[:15]:
    print(f'  Row {u[0]}: {u[1]}')