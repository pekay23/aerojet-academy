import csv
import os

# Strategy: The doc-text files contain the source questions with answers marked by *.
# The CSV questions may be slightly different text. We'll match by extracting
# key identifying words from each question and matching against doc-text.

# First, let's parse the doc-text files more carefully.
# Each doc-text file has numbered questions with options a/b/c, one marked with *

def parse_doc_text(path):
    """Parse a doc-text file. Return list of dicts with question number, text, and answer letter."""
    results = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    lines = content.split('\n')
    i = 0
    current_q = None
    current_num = None
    while i < len(lines):
        line = lines[i].strip()
        # Skip page markers
        if line.startswith('---') or 'Page' in line or 'P age' in line:
            i += 1
            continue
        # Match numbered question: "1. text" or "45. text" etc.
        if line and line[0].isdigit():
            parts = line.split('. ', 1)
            if len(parts) == 2 and parts[0].strip().isdigit():
                try:
                    num = int(parts[0].strip())
                    qtext = parts[1].strip()
                    current_q = qtext
                    current_num = num
                except ValueError:
                    pass
                i += 1
                continue
        # Check for answer options
        if current_q and line:
            low = line.lower().strip()
            # Check for * marker
            if '*' in line:
                if low.startswith('a.') or low.startswith('a ') or low.startswith('- a'):
                    results.append({'num': current_num, 'q': current_q, 'ans': 'A', 'src': os.path.basename(path)})
                elif low.startswith('b.') or low.startswith('b ') or low.startswith('- b'):
                    results.append({'num': current_num, 'q': current_q, 'ans': 'B', 'src': os.path.basename(path)})
                elif low.startswith('c.') or low.startswith('c ') or low.startswith('- c'):
                    results.append({'num': current_num, 'q': current_q, 'ans': 'C', 'src': os.path.basename(path)})
                current_q = None
                current_num = None
        i += 1
    return results

# Load all doc-text answers
all_entries = []
for fname in sorted(os.listdir('doc-text/M2')):
    if fname.endswith('.txt'):
        path = os.path.join('doc-text/M2', fname)
        entries = parse_doc_text(path)
        all_entries.extend(entries)

print(f"Total entries from doc-text: {len(all_entries)}")
for e in all_entries:
    print(f"  Q{e['num']}: [{e['ans']}] {e['q'][:80]}... src={e['src']}")