import sys
sys.stdout.reconfigure(encoding='utf-8')

import pymupdf  # PyMuPDF
import re, os

one_drive = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals'

# Try the "module 3 easa book.pdf" - search for answer keys
easa_book = os.path.join(one_drive, 'module 3 easa book.pdf')
print(f"File size: {os.path.getsize(easa_book) / 1024 / 1024:.1f} MB")

# Extract all text and search for answer patterns
doc = pymupdf.open(easa_book)
print(f"Pages: {doc.page_count}")

full_text = ''
for i in range(doc.page_count):
    page = doc.load_page(i)
    full_text += page.get_text()

print(f"Extracted: {len(full_text)} chars")

# Search for answer key patterns
answer_patterns = [
    r'answer\s*key',
    r'answers\s*[:\n]',
    r'solution\s*[:\n]',
    r'ANSWERS',
    r'SOLUTIONS',
    r'review\s*answer',
    r'question\s*and\s*answer',
]

for pattern in answer_patterns:
    matches = list(re.finditer(pattern, full_text, re.IGNORECASE))
    if matches:
        print(f"\nPattern '{pattern}': {len(matches)} matches")
        for m in matches[:3]:
            start = max(0, m.start() - 100)
            end = min(len(full_text), m.end() + 200)
            print(f"  Context: ...{full_text[start:end]}...")

# Also search for patterns like "1. a)" or "1.a)" which might be answer listings
answer_list_pattern = r'\d+\.\s*[abc]\)'
matches = re.findall(answer_list_pattern, full_text)
if matches:
    print(f"\nAnswer list pattern (N. a/b/c)): {len(matches)} matches")
    # Find where these are concentrated
    positions = [m.start() for m in re.finditer(answer_list_pattern, full_text)]
    print(f"  First at pos {positions[0]}, last at pos {positions[-1]}")
    # Check the last occurrence context
    last_pos = positions[-1]
    print(f"  Context around last: {full_text[max(0,last_pos-200):last_pos+200]}")

# Check the last pages
print(f"\n--- Last 3000 chars ---")
print(full_text[-3000:])

# Also search for "Correct" or "correct"
correct_mentions = re.findall(r'[Cc]orrect', full_text)
print(f"\n'Correct' mentions: {len(correct_mentions)}")
doc.close()
