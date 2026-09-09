import sys
import json
import re

# Fix encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

# Load the Suntech corpus
corpus_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M3.jsonl'
corpus_entries = []
with open(corpus_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line:
            entry = json.loads(line)
            corpus_entries.append(entry)

print(f"Total corpus entries: {len(corpus_entries)}")

# Search for answer keys
answer_keywords = ['answer key', 'answer:', 'answers:', 'ANSWERS', 'solutions', 'solution:', 'key:']
for i, entry in enumerate(corpus_entries):
    text = entry.get('text', '').lower()
    for kw in ['answer key', 'answer:', 'answers:', 'solutions', 'solution:', 'key:']:
        if kw in text:
            print(f"\n--- Entry {i} (page {entry.get('page')}, source {entry.get('source')}) - contains '{kw}' ---")
            print(entry.get('text', '')[:500])
            break

# Also search for patterns like "Q1 answer" or "1. answer"
for i, entry in enumerate(corpus_entries):
    text = entry.get('text', '')
    if re.search(r'\banswer\b', text, re.IGNORECASE):
        # Check if it looks like an answer key (lots of "answer" mentions)
        ans_count = len(re.findall(r'\banswer\b', text, re.IGNORECASE))
        if ans_count > 5:
            print(f"\n--- Entry {i} (page {entry.get('page')}) - {ans_count} 'answer' mentions ---")
            print(text[:1000])

print("\n=== Corpus pages with potential Q&A ===")
for i, entry in enumerate(corpus_entries):
    text = entry.get('text', '')
    # Look for patterns like "What is" followed by "answer:"
    if re.search(r'what\s+(is|are|happens|will)', text, re.IGNORECASE) and re.search(r'answer', text, re.IGNORECASE):
        print(f"  Entry {i} (page {entry.get('page')}): {text[:200]}")
