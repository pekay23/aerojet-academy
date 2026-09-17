import csv, json, sys, re, math
from collections import defaultdict
sys.stdout.reconfigure(encoding='utf-8')

INPUT_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'
OUTPUT_JSON = r'C:\Projects\aerojet-academy\scripts\easa-seed\unanswered_m1.json'

with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = []
for i, row in enumerate(rows):
    if not row.get('correctAnswer', '').strip():
        unanswered.append({
            'csv_row_index': i,
            'module': row.get('module', ''),
            'syllabusRef': row.get('syllabusRef', ''),
            'text': row.get('text', ''),
            'optionA': row.get('optionA', ''),
            'optionB': row.get('optionB', ''),
            'optionC': row.get('optionC', ''),
            'optionD': row.get('optionD', ''),
            'difficulty': row.get('difficulty', ''),
            'subTopic': row.get('subTopic', ''),
            'sourceFile': row.get('sourceFile', ''),
            'status': row.get('status', ''),
            'reviewNote': row.get('reviewNote', ''),
        })

print(f'Total unanswered: {len(unanswered)}')

# Group by source file
by_source = defaultdict(list)
for q in unanswered:
    by_source[q['sourceFile']].append(q)

for src, qs in sorted(by_source.items(), key=lambda x: -len(x[1])):
    print(f'  {len(qs):3d} {src}')

# Group by topic keywords
topics = defaultdict(int)
for q in unanswered:
    t = q['text'].lower()
    if any(w in t for w in ['binary', 'hex', 'octal', 'denary', 'decimal']):
        topics['number_systems'] += 1
    if any(w in t for w in ['sin', 'cos', 'tan', 'trigonometry', 'radians', 'degree']):
        topics['trigonometry'] += 1
    if any(w in t for w in ['circle', 'radius', 'diameter', 'circumference', 'cone', 'cylinder', 'volume', 'area', 'perimeter']):
        topics['geometry'] += 1
    if any(w in t for w in ['triangle', 'angle', 'pythagoras', 'right triangle']):
        topics['triangles_angles'] += 1
    if any(w in t for w in ['algebra', 'equation', 'solve', 'factorise', 'quadratic', 'simplify']):
        topics['algebra'] += 1
    if any(w in t for w in ['log', 'logarithm', 'standard form', 'percentage', 'ratio', 'fraction', 'percent']):
        topics['arithmetic'] += 1
    if any(w in t for w in ['gradient', 'graph', 'coordinate', 'line', 'intercept']):
        topics['graphs'] += 1
    if any(w in t for w in ['gear', 'rpm', 'velocity', 'speed', 'distance']):
        topics['mechanical'] += 1

print('\n--- By topic ---')
for topic, count in sorted(topics.items(), key=lambda x: -x[1]):
    print(f'  {count:3d} {topic}')

with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(unanswered, f, indent=2, ensure_ascii=False)

print(f'\nSaved to {OUTPUT_JSON}')
