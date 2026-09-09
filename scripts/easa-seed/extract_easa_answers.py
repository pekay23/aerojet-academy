import sys
sys.stdout.reconfigure(encoding='utf-8')

import pymupdf
import re, os, json

one_drive = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals'
easa_book_path = os.path.join(one_drive, 'module 3 easa book.pdf')

doc = pymupdf.open(easa_book_path)
full_text = ''
for i in range(doc.page_count):
    page = doc.load_page(i)
    full_text += page.get_text()
doc.close()

# Save full text for processing
out_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\easa_book_full.txt'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(full_text)
print(f"Saved full text: {len(full_text)} chars to {out_path}")

# Now let's find all "ANSWERS" sections and extract the Q&A pairs
# The format seems to be:
# [Question section]
# ANSWERS
# Answer: X-Y
# [answer text]
# Answer: X-Y+1
# [answer text]
# ...

# Let's find all "Answer:" patterns and extract the surrounding context
# First, let's find where ALL "Answer:" occurrences are
answer_matches = list(re.finditer(r'Answer:\s*(\d+)-(\d+)', full_text))
print(f"\nTotal 'Answer: X-Y' occurrences: {len(answer_matches)}")

# Let's look at the first 50 to understand the format
for m in answer_matches[:50]:
    start = m.start()
    end = m.end()
    # Get what follows the "Answer: X-Y"
    after = full_text[end:end+300].strip()
    print(f"  {m.group()}: {after[:150]}")

# Let's also find question sections
# Questions seem to follow a pattern like "X.Y" followed by question text and options
# Let's find all question blocks
print("\n--- Looking for question patterns ---")
# Find patterns like "1.1" followed by question text
q_pattern = re.compile(r'(\d+\.\d+)\s*[:\-]?\s*\n?(.+?)(?=\n(?:\d+\.\d+|\(a\)|\(b\)|\(c\)|Answer))', re.DOTALL)
q_matches = q_pattern.findall(full_text[:50000])
print(f"Found {len(q_matches)} question patterns in first 50KB")
for q in q_matches[:20]:
    print(f"  {q[0]}: {q[1][:100]}")
