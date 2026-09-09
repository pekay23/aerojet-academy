import sys
sys.stdout.reconfigure(encoding='utf-8')
import json, re, csv

# Load the matched Q&A pairs
with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\matched_qa_pairs.json', 'r', encoding='utf-8') as f:
    matched = json.load(f)

# Load all unanswered questions with their full PDF text
csv_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv'
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = [r for r in rows if not r.get('correctAnswer','').strip()]

# Build a lookup from PDF question number to CSV row
from collections import defaultdict

# Load PDF questions
pdf_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_261722955-Module-3_v2.txt'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf_text = f.read()

lines = pdf_text.split('\n')
pdf_questions = {}
current_num = None
current_q = {}

for line in lines:
    line = line.strip()
    q_match = re.match(r'^(\d+)\.\s+(.+)', line)
    if q_match:
        if current_num is not None and 'a' in current_q and 'b' in current_q and 'c' in current_q:
            pdf_questions[current_num] = current_q.copy()
        current_num = int(q_match.group(1))
        current_q = {'text': q_match.group(2)}
    elif current_num is not None:
        opt_match = re.match(r'^([abc])\)\s+(.+)', line)
        if opt_match:
            current_q[opt_match.group(1)] = opt_match.group(2)

if current_num is not None and 'a' in current_q and 'b' in current_q and 'c' in current_q:
    pdf_questions[current_num] = current_q.copy()

print(f"PDF questions: {len(pdf_questions)}")

# For each CSV unanswered question, find the corresponding PDF question
q_num_map = {}  # csv_index -> pdf_q_num
for idx, csv_row in enumerate(unanswered):
    csv_raw = csv_row.get('rawJson', '').strip()
    try:
        raw = json.loads(csv_raw)
        pdf_q_text = raw.get('raw', '')
        q_num_match = re.search(r'(\d+)\.\s', pdf_q_text)
        if q_num_match:
            q_num = int(q_num_match.group(1))
            if q_num in pdf_questions:
                q_num_map[idx] = q_num
    except:
        pass

print(f"Matched CSV rows to PDF questions: {len(q_num_map)}")

# Now categorize all matched questions
categories = defaultdict(list)
for idx, csv_row in enumerate(unanswered):
    if idx not in q_num_map:
        categories['unmatched'].append((idx, csv_row))
        continue
    
    q_num = q_num_map[idx]
    pq = pdf_questions[q_num]
    full_text = pq['text']
    
    # Categorize by keywords
    text_lower = full_text.lower()
    
    # Calculation questions
    has_numbers = bool(re.search(r'\d+', full_text))
    
    if 'capacitor' in text_lower and ('volt' in text_lower or 'time' in text_lower or 'farad' in text_lower or 'micro' in text_lower):
        categories['capacitor_calc'].append((idx, csv_row, pq, q_num))
    elif 'transformer' in text_lower and has_numbers:
        categories['transformer_calc'].append((idx, csv_row, pq, q_num))
    elif 'ohm' in text_lower and has_numbers:
        categories['ohm_calc'].append((idx, csv_row, pq, q_num))
    elif 'power' in text_lower and has_numbers and ('watt' in text_lower or 'amp' in text_lower or 'volt' in text_lower):
        categories['power_calc'].append((idx, csv_row, pq, q_num))
    elif ('rms' in text_lower or 'peak' in text_lower or 'average' in text_lower) and has_numbers:
        categories['ac_calc'].append((idx, csv_row, pq, q_num))
    elif 'resistance' in text_lower and has_numbers and ('ohm' in text_lower):
        categories['resistance_calc'].append((idx, csv_row, pq, q_num))
    elif 'motor' in text_lower:
        categories['motor'].append((idx, csv_row, pq, q_num))
    elif 'generator' in text_lower:
        categories['generator'].append((idx, csv_row, pq, q_num))
    elif 'magnet' in text_lower or 'magnetic' in text_lower:
        categories['magnetism'].append((idx, csv_row, pq, q_num))
    elif 'current' in text_lower or 'volt' in text_lower or 'resistance' in text_lower:
        categories['basic_elec'].append((idx, csv_row, pq, q_num))
    elif 'filter' in text_lower:
        categories['filters'].append((idx, csv_row, pq, q_num))
    elif 'cell' in text_lower or 'battery' in text_lower:
        categories['cells'].append((idx, csv_row, pq, q_num))
    elif 'induct' in text_lower:
        categories['inductance'].append((idx, csv_row, pq, q_num))
    elif 'frequency' in text_lower:
        categories['frequency'].append((idx, csv_row, pq, q_num))
    elif 'semicon' in text_lower or 'diode' in text_lower or 'transistor' in text_lower or 'pn' in text_lower:
        categories['semiconductors'].append((idx, csv_row, pq, q_num))
    elif 'phase' in text_lower:
        categories['ac_theory'].append((idx, csv_row, pq, q_num))
    else:
        categories['concepts'].append((idx, csv_row, pq, q_num))

print("\n=== Category counts ===")
for cat, items in sorted(categories.items(), key=lambda x: -len(x[1])):
    print(f"  {cat}: {len(items)}")

# Print sample questions from each calculation category
for cat in ['capacitor_calc', 'transformer_calc', 'ohm_calc', 'power_calc', 'ac_calc', 'resistance_calc']:
    if cat in categories and categories[cat]:
        print(f"\n=== Sample {cat} questions ===")
        for idx, csv_row, pq, q_num in categories[cat][:5]:
            print(f"  Q{q_num}: {pq['text'][:100]}")
            print(f"    a) {pq.get('a','')[:50]}")
            print(f"    b) {pq.get('b','')[:50]}")
            print(f"    c) {pq.get('c','')[:50]}")

# Print concept questions
print(f"\n=== Sample concept questions (first 20) ===")
for idx, csv_row, pq, q_num in categories.get('concepts', [])[:20]:
    print(f"  Q{q_num}: {pq['text'][:100]}")
    print(f"    a) {pq.get('a','')[:50]}")
    print(f"    b) {pq.get('b','')[:50]}")
    print(f"    c) {pq.get('c','')[:50]}")

print(f"\n=== Sample motor questions (first 10) ===")
for idx, csv_row, pq, q_num in categories.get('motor', [])[:10]:
    print(f"  Q{q_num}: {pq['text'][:100]}")
    print(f"    a) {pq.get('a','')[:50]}")
    print(f"    b) {pq.get('b','')[:50]}")
    print(f"    c) {pq.get('c','')[:50]}")

print(f"\n=== Sample generator questions (first 10) ===")
for idx, csv_row, pq, q_num in categories.get('generator', [])[:10]:
    print(f"  Q{q_num}: {pq['text'][:100]}")
    print(f"    a) {pq.get('a','')[:50]}")
    print(f"    b) {pq.get('b','')[:50]}")
    print(f"    c) {pq.get('c','')[:50]}")

print(f"\n=== Sample magnetism questions (first 10) ===")
for idx, csv_row, pq, q_num in categories.get('magnetism', [])[:10]:
    print(f"  Q{q_num}: {pq['text'][:100]}")
    print(f"    a) {pq.get('a','')[:50]}")
    print(f"    b) {pq.get('b','')[:50]}")
    print(f"    c) {pq.get('c','')[:50]}")

print(f"\n=== Sample cells questions (first 10) ===")
for idx, csv_row, pq, q_num in categories.get('cells', [])[:10]:
    print(f"  Q{q_num}: {pq['text'][:100]}")
    print(f"    a) {pq.get('a','')[:50]}")
    print(f"    b) {pq.get('b','')[:50]}")
    print(f"    c) {pq.get('c','')[:50]}")
