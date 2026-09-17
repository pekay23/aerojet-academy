import csv
import json

with open('csvs_answered/M1.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    empty = [i for i, r in enumerate(rows) if not r.get('correctAnswer','').strip()]
    print(f'Total rows: {len(rows)}')
    print(f'Empty correctAnswer: {len(empty)}')
    print(f'Answered: {len(rows)-len(empty)}')
    for i in empty[:20]:
        text = rows[i]['text'].replace('\n',' ')[:100]
        opts = [rows[i].get(f'option{c}','') for c in 'ABCD']
        print(f'Row {i+2}: {text}')
        print(f'  Options: {opts}')
        print(f'  Review: {rows[i].get("reviewNote","")}')
