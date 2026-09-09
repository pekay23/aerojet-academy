
import json

CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    corpus_entries = [json.loads(line) for line in f if line.strip()]

searches = [
    'Ni/Cd',
    'nickel cadmium',
    'thermal runaway',
    'lithium ion aircraft',
    'lead acid aircraft',
    'most common aircraft battery',
    'rudder servo actuator',
    'deflection degrees rudder',
    'volt hour capacity',
    'ampere hour capacity',
    'on charge voltage',
    'case of a Ni',
    'potassium hydroxide',
]

for term in searches:
    print(f'\n=== SEARCH: {term} ===')
    found = False
    for entry in corpus_entries:
        text = entry.get('text', '')
        if term.lower() in text.lower():
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if term.lower() in line.lower():
                    start = max(0, i-2)
                    end = min(len(lines), i+5)
                    print('\n'.join(lines[start:end]))
                    print('---')
                    found = True
                    break
        if found:
            break
    if not found:
        print('No match')
