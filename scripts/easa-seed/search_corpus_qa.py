import sys
sys.stdout.reconfigure(encoding='utf-8')

import json, os

# The M03-Training-book.pdf is the source of the Suntech corpus
# Check if it has sample questions with answers
# The corpus has 321 entries. Let me look for entries that contain sample questions

corpus_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M3.jsonl'
entries = []
with open(corpus_path, 'r', encoding='utf-8') as f:
    for line in f:
        entries.append(json.loads(line.strip()))

# Search for entries that contain both question words and answer patterns
import re
for i, entry in enumerate(entries):
    text = entry.get('text', '')
    page = entry.get('page', '?')
    # Look for "Sample Questions" or "answer" or question number patterns
    if re.search(r'sample question|answer key|practice question|review question', text, re.IGNORECASE):
        print(f"\n=== Entry {i} (page {page}) ===")
        # Print just relevant parts
        lines = text.split('\n')
        for line in lines:
            if re.search(r'question|answer|sample|practice|review', line, re.IGNORECASE):
                print(f"  {line.strip()[:150]}")
        print()

# Also look at the end of the corpus (later pages might have answers)
print("\n=== Last 10 entries ===")
for entry in entries[-10:]:
    page = entry.get('page', '?')
    text = entry.get('text', '')[:300]
    print(f"Page {page}: {text}")
