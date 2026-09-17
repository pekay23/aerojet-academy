import csv
import os

# Parse doc-text files for answers (questions with * marked option)
def parse_doc_text(path):
    results = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    lines = content.split('\n')
    i = 0
    current_q = None
    current_num = None
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('---') or 'Page' in line or 'P age' in line:
            i += 1
            continue
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
        if current_q and line:
            low = line.lower().strip()
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

all_entries = []
for fname in sorted(os.listdir('doc-text/M2')):
    if fname.endswith('.txt'):
        path = os.path.join('doc-text/M2', fname)
        entries = parse_doc_text(path)
        all_entries.extend(entries)

print(f"Total entries from doc-text: {len(all_entries)}")

# Load CSV
with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

def match_question(csv_text, entry_q):
    """Check if CSV question matches doc-text question."""
    ct = csv_text.strip().lower()
    eq = entry_q.strip().lower()
    # Direct containment
    if ct in eq or eq in ct:
        return True
    # Try matching first 30 chars
    if len(ct) > 30 and len(eq) > 30 and ct[:30] == eq[:30]:
        return True
    return False

# Apply answers
updated = 0
unanswered = [r for r in rows if not r.get('correctAnswer', '').strip()]
for r in unanswered:
    txt = r.get('text', '').strip()
    if not txt:
        continue
    for entry in all_entries:
        if match_question(txt, entry['q']):
            r['correctAnswer'] = entry['ans']
            r['reviewNote'] = f'Answered from doc-text: {entry["src"]}'
            updated += 1
            break

print(f"Updated {updated} questions from doc-text matching")

# Write back
with open('csvs_answered/M2.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

# Verify
with open('csvs_answered/M2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows2 = list(reader)
unanswered2 = [r for r in rows2 if not r.get('correctAnswer', '').strip()]
print(f"Remaining unanswered: {len(unanswered2)}")
for i, r in enumerate(unanswered2):
    print(f"  {i+1}. [{r.get('syllabusRef','?')}] {r.get('text','')[:100]}")