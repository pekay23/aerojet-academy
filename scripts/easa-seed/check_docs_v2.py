import sys
sys.stdout.reconfigure(encoding='utf-8')
import re, os, json

doc_dir = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3'

docs = {}
for fname in sorted(os.listdir(doc_dir)):
    if fname.startswith('onedrive_'):
        with open(os.path.join(doc_dir, fname), 'r', encoding='utf-8') as f:
            docs[fname] = f.read()

# Check Revision Sub Module (the correct filename)
for fname, text in docs.items():
    if 'Revision Sub' in fname:
        print(f"\n=== {fname}: {len(text)} chars ===")
        # Look for answer patterns
        for line in text.split('\n'):
            line = line.strip()
            if re.search(r'\b[A-C]\)\s|answer|solution|correct|key', line, re.IGNORECASE) and len(line) > 5:
                print(f"  {line[:200]}")
        break

# Check TRANSFORMER
for fname, text in docs.items():
    if 'TRANSFORMER' in fname and 'TRAINING' not in fname:
        print(f"\n=== {fname}: {len(text)} chars ===")
        # Print all lines that contain question indicators
        for line in text.split('\n'):
            stripped = line.strip()
            if len(stripped) > 5 and re.search(r'question|what|how|when|why|which|calculate|determine|if|frequenc|volt|amp|resistance|capacit|transform|motor|generat|induct|magnet|filter|phase|power|current|circuit', stripped, re.IGNORECASE):
                print(f"  {stripped[:200]}")
        break

# Check Module 3 Quiz 3
for fname, text in docs.items():
    if 'Quiz' in fname:
        print(f"\n=== {fname}: {repr(text[:200])}")
        break

# Check Team November
for fname, text in docs.items():
    if 'TeamNovember_2' in fname:
        print(f"\n=== {fname}: {len(text)} chars ===")
        print(text[:500])
        break

# Check Group Charlie
for fname, text in docs.items():
    if 'GroupCharlie' in fname:
        print(f"\n=== {fname}: {len(text)} chars ===")
        print(text[:500])
        break

# Check Capacitors
for fname, text in docs.items():
    if 'Capacitors' in fname:
        print(f"\n=== {fname}: {len(text)} chars ===")
        print(text[:500])
        break
