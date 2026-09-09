import sys
sys.stdout.reconfigure(encoding='utf-8')

import json, re, csv
from difflib import SequenceMatcher

# Load CSV
csv_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv'
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = [r for r in rows if not r.get('correctAnswer','').strip()]
answered = [r for r in rows if r.get('correctAnswer','').strip()]

print(f"Total: {len(rows)}, Answered: {len(answered)}, Unanswered: {len(unanswered)}")

# Load all extracted doc texts
import os
doc_text_dir = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3'
doc_texts = {}
for fname in os.listdir(doc_text_dir):
    if fname.startswith('onedrive_'):
        with open(os.path.join(doc_text_dir, fname), 'r', encoding='utf-8') as f:
            doc_texts[fname] = f.read()

# Load Suntech corpus
corpus_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M3.jsonl'
corpus_text = ''
with open(corpus_path, 'r', encoding='utf-8') as f:
    for line in f:
        entry = json.loads(line.strip())
        corpus_text += '\n' + entry.get('text', '')

print(f"\nCorpus text length: {len(corpus_text)} chars")

# Let's look at the 261722955-Module-3.pdf text and count questions
pdf_text = doc_texts.get('onedrive_261722955-Module-3_v2.txt', '')
# Count numbered questions like "1. " or "770. "
questions_in_pdf = re.findall(r'(\d+)\.\s+[A-Z].*?\n\s*[abc\)].*?\n', pdf_text)
number_matches = re.findall(r'(\d+)\.\s', pdf_text)
print(f"\nQuestions found in 261722955 PDF (by number pattern): ~{len(number_matches)}")

# Let's look for "answer" sections in the PDF
ans_matches = re.findall(r'[Aa]nswer[:\s]', pdf_text)
print(f"Answer mentions in 261722955 PDF: {len(ans_matches)}")

# Check the last few pages of the PDF more carefully
print("\n--- Last 2000 chars of 261722955 PDF ---")
print(pdf_text[-2000:])

# Now let's look at how questions appear in the PDF
print("\n--- First 3000 chars of 261722955 PDF ---")
print(pdf_text[:3000])
