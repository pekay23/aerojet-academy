
import json

CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'

with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
    corpus_entries = [json.loads(line) for line in f if line.strip()]

# Get page 122 (yaw damper servo)
for entry in corpus_entries:
    if entry.get('page') == 122:
        print('=== PAGE 122 ===')
        print(entry.get('text', ''))
        print()
        break

# Get pages around fully charged lead acid
for entry in corpus_entries:
    text = entry.get('text', '')
    if 'fully charged condition' in text.lower():
        print('=== FULLY CHARGED LEAD ACID ===')
        print(text)
        print()
        break

# Get Bourdon tube context
for entry in corpus_entries:
    text = entry.get('text', '')
    if 'Bourdon tube' in text:
        print('=== BOURDON TUBE ===')
        print(text)
        print()
        break
