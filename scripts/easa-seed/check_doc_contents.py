import sys
sys.stdout.reconfigure(encoding='utf-8')

import re, os

# Check the TRANSFORMER 4 document
tf_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_TRANSFORMER 4 (1)_230801_085906.txt'
with open(tf_path, 'r', encoding='utf-8') as f:
    tf_text = f.read()
print(f"=== TRANSFORMER 4 doc: {len(tf_text)} chars ===")
# Look for question-answer patterns
for line in tf_text.split('\n'):
    line = line.strip()
    if re.search(r'question|answer|q\d|\d\)\s', line, re.IGNORECASE) and len(line) > 5:
        print(f"  {line[:200]}")

# Check Revision Sub Module
rev_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_Revision SubModule.txt'
with open(rev_path, 'r', encoding='utf-8') as f:
    rev_text = f.read()
print(f"\n=== Revision SubModule: {len(rev_text)} chars ===")
# Look for answer patterns
for line in rev_text.split('\n'):
    line = line.strip()
    if re.search(r'\b[A-C]\)\s|answer|solution|correct|key', line, re.IGNORECASE) and len(line) > 5:
        print(f"  {line[:200]}")

# Check Module 3 Quiz 3
quiz_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_Module3_Quiz3.txt'
with open(quiz_path, 'r', encoding='utf-8') as f:
    quiz_text = f.read()
print(f"\n=== Module 3 Quiz 3: {repr(quiz_text[:200])}")

# Check Team November
tn_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_TeamNovember.txt'
with open(tn_path, 'r', encoding='utf-8') as f:
    tn_text = f.read()
print(f"\n=== Team November: {len(tn_text)} chars ===")
print(tn_text[:500])

# Check Group Charlie
gc_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_GroupCharlie.txt'
with open(gc_path, 'r', encoding='utf-8') as f:
    gc_text = f.read()
print(f"\n=== Group Charlie: {len(gc_text)} chars ===")
print(gc_text[:500])

# Check Capacitors
cap_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_Capacitors.txt'
with open(cap_path, 'r', encoding='utf-8') as f:
    cap_text = f.read()
print(f"\n=== Capacitors: {len(cap_text)} chars ===")
print(cap_text[:500])
