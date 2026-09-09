import csv
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('csvs_answered/M1.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    empty = [i for i, r in enumerate(rows) if not r.get('correctAnswer','').strip()]
    print(f'Total rows: {len(rows)}')
    print(f'Empty correctAnswer: {len(empty)}')
    print(f'Answered: {len(rows)-len(empty)}')
    
    unanswered = []
    for i in empty:
        r = rows[i]
        unanswered.append({
            'row_index': i,
            'module': r.get('module',''),
            'syllabusRef': r.get('syllabusRef',''),
            'text': r.get('text',''),
            'optionA': r.get('optionA',''),
            'optionB': r.get('optionB',''),
            'optionC': r.get('optionC',''),
            'optionD': r.get('optionD',''),
            'difficulty': r.get('difficulty',''),
            'subTopic': r.get('subTopic',''),
            'reviewNote': r.get('reviewNote',''),
            'sourceFile': r.get('sourceFile',''),
            'rawJson': r.get('rawJson','')
        })
    
    with open('unanswered_m1.json', 'w', encoding='utf-8') as out:
        json.dump(unanswered, out, indent=2, ensure_ascii=False)
    
    print(f'Saved {len(unanswered)} unanswered questions to unanswered_m1.json')
