import csv, json, re, os

BASE = 'C:/Projects/aerojet-academy/scripts/easa-seed'

with open(f'{BASE}/csvs_answered/M4.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

corpus = []
with open(f'{BASE}/corpus/M4.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        corpus.append(json.loads(line))

with open(f'{BASE}/doc-text/M4/M4 Standard EASA Exam.txt', 'r', encoding='utf-8') as f:
    doctext = f.read()

for i, row in enumerate(rows):
    print(f'Q{i}: {row["text"][:120]}')
    print(f'  A: {row["optionA"][:60]}')
    print(f'  B: {row["optionB"][:60]}')
    print(f'  C: {row["optionC"][:60]}')
    print(f'  D: {row["optionD"][:60]}')
    print(f'  src: {row["sourceFile"]}')
    print()