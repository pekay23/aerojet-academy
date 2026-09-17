
import json, re

CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

queries = [
    'rudder deflection range',
    'rudder servo deflection',
    'yaw damper servo deflection',
    'secondary battery cell',
    'most commonly used in aircraft battery',
    'Volt-Hour battery capacity',
    'relative density fully charged lead',
    'electrolyte discharge lead acid',
    'discharge rate 25 Ampere',
    'on charge voltage lead acid',
    'NiCd case material',
    'NiCd electrolyte',
    'thermal runaway NiCd',
    'Bourdon tube pressure',
    'synchro stator coils',
]

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

corpus_text = '\n'.join(json.loads(line).get('text', '') for line in lines if line.strip())
corpus_lower = corpus_text.lower()

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
    if best_match and best_score >= 3:
        print(f'Best match (score {best_score}): {best_match[:400]}')
    else:
        print('No good match found')
