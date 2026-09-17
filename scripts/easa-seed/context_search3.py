
import json

CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    corpus_entries = [json.loads(line) for line in f if line.strip()]

searches = [
    'most commonly used',
    'most common',
    'preferred for use in aircraft',
    'lithium ion',
    'lead acid battery',
    'nickel cadmium preferred',
    'secondary battery',
    'capacity of a battery cell',
    'unit used to measure the capacity',
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
                    start = max(0, i-3)
                    end = min(len(lines), i+6)
                    print('\n'.join(lines[start:end]))
                    print('---')
                    found = True
                    break
        if found:
            break
    if not found:
        print('No match')
