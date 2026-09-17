
import json, re

CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    corpus_entries = [json.loads(line) for line in f if line.strip()]

# Search for specific contexts
search_terms = [
    'yaw damper servo',
    'secondary battery cell',
    'most commonly used in aircraft',
    'fully charged condition',
    '25 Amperes-Hours',
    'synchro has a rotor and three stator',
    'Bourdon tube',
    'on charge voltage',
    'relative density fully charged',
]

for term in search_terms:
    print(f'\n=== SEARCH: {term} ===')
    found = False
    for entry in corpus_entries:
        text = entry.get('text', '')
        if term.lower() in text.lower():
            # Find the matching line and print surrounding context
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if term.lower() in line.lower():
                    start = max(0, i-3)
                    end = min(len(lines), i+4)
                    print('\n'.join(lines[start:end]))
                    print('---')
                    found = True
                    break
        if found:
            break
    if not found:
        print('No match')
