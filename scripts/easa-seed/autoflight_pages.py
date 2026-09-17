
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    corpus_entries = [json.loads(line) for line in f if line.strip()]

# Get pages 119-125
for entry in corpus_entries:
    page = entry.get('page')
    if 119 <= page <= 125:
        print(f'=== PAGE {page} ===')
        text = entry.get('text', '')
        print(text)
        print()
