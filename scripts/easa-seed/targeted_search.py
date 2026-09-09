
import json, re

CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

queries = [
    'rudder deflection yaw damper',
    'thermal runaway NiCd battery',
    'lead acid electrolyte discharge',
    'NiCd battery case material',
    'QFE QNH terrain',
    'series mode rudder deflection',
    'CWS control wheel steering',
    'battery discharge rate test current',
]

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

corpus_text = '\n'.join(json.loads(line).get('text', '') for line in lines if line.strip())

for q in queries:
    print(f'\n=== QUERY: {q} ===')
    keywords = q.lower().split()
    best_score = 0
    best_match = None
    for line in corpus_text.split('\n'):
        line_lower = line.lower()
        score = sum(1 for k in keywords if k in line_lower)
        if score > best_score:
            best_score = score
            best_match = line
        if best_score >= len(keywords):
            break
    if best_match and best_score >= 2:
        print(f'Best match (score {best_score}): {best_match[:300]}')
    else:
        print('No good match found')
