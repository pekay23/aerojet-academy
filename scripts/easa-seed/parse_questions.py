import sys
sys.stdout.reconfigure(encoding='utf-8')

import json, re, csv, math, os
from difflib import SequenceMatcher, get_close_matches

# ============================================================
# STEP 1: Parse the 261722955-Module-3.pdf to get all 770 questions
# ============================================================
pdf_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_261722955-Module-3_v2.txt'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf_text = f.read()

# Parse questions: pattern is "N. question text\na) option\nb) option\nc) option"
# The PDF has "Page X" separators between pages
# Let's parse by looking for question numbers
question_pattern = re.compile(r'(\d+)\.\s+(.+?)\n(a)\)\s+(.+?)\n(b)\)\s+(.+?)\n(c)\)\s+(.+?)(?=\n(?:\d+\.\s|\n\n|\Z))', re.DOTALL)

# Let's try a different approach - parse line by line
lines = pdf_text.split('\n')
pdf_questions = {}  # num -> {text, a, b, c}
current_num = None
current_q = {}

for i, line in enumerate(lines):
    line = line.strip()
    # Check if this line starts a question
    q_match = re.match(r'^(\d+)\.\s+(.+)', line)
    if q_match:
        # Save previous question
        if current_num is not None and 'a' in current_q and 'b' in current_q and 'c' in current_q:
            pdf_questions[current_num] = current_q.copy()
        current_num = int(q_match.group(1))
        current_q = {'text': q_match.group(2)}
    elif current_num is not None:
        opt_match = re.match(r'^([abc])\)\s+(.+)', line)
        if opt_match:
            current_q[opt_match.group(1)] = opt_match.group(2)

# Save the last one
if current_num is not None and 'a' in current_q and 'b' in current_q and 'c' in current_q:
    pdf_questions[current_num] = current_q.copy()

print(f"Parsed {len(pdf_questions)} questions from PDF")

# Verify a few
for n in [1, 2, 10, 100, 500, 770]:
    if n in pdf_questions:
        q = pdf_questions[n]
        print(f"Q{n}: {q['text'][:80]}")
        print(f"  a) {q.get('a','')[:50]}")
        print(f"  b) {q.get('b','')[:50]}")
        print(f"  c) {q.get('c','')[:50]}")

# ============================================================
# STEP 2: Load CSV questions
# ============================================================
csv_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv'
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    csv_rows = list(reader)

unanswered = [r for r in csv_rows if not r.get('correctAnswer','').strip()]
print(f"\nCSV unanswered: {len(unanswered)}")

# ============================================================
# STEP 3: Match CSV questions to PDF questions
# ============================================================
def fuzzy_match(q1, q2, threshold=0.6):
    """Fuzzy match two question texts"""
    r = SequenceMatcher(None, q1.lower(), q2.lower()).ratio()
    return r

matched_count = 0
matched_questions = []
unmatched_questions = []

for csv_row in unanswered:
    csv_text = csv_row.get('text', '').strip()
    csv_raw = csv_row.get('rawJson', '').strip()
    
    # Try to extract the full question from rawJson
    try:
        raw = json.loads(csv_raw) if csv_raw.startswith('{') else {}
        pdf_q_text = raw.get('raw', '')
        # The raw field has the full question text
        # Extract the question number
        q_num_match = re.search(r'(\d+)\.\s', pdf_q_text)
        if q_num_match:
            q_num = int(q_num_match.group(1))
            if q_num in pdf_questions:
                matched_count += 1
                matched_questions.append((csv_row, pdf_questions[q_num], q_num))
                continue
    except:
        pass
    
    # Try fuzzy matching on text
    best_score = 0
    best_match = None
    for num, pq in pdf_questions.items():
        score = fuzzy_match(csv_text, pq['text'])
        if score > best_score and score > 0.4:
            best_score = score
            best_match = (num, pq)
    
    if best_match:
        matched_count += 1
        matched_questions.append((csv_row, best_match[1], best_match[0]))
    else:
        unmatched_questions.append(csv_row)

print(f"Matched to PDF: {matched_count}, Unmatched: {len(unmatched_questions)}")

# Save matched questions for analysis
with open(os.path.join(os.path.dirname(__file__), 'matched_qa_pairs.json'), 'w', encoding='utf-8') as f:
    data = []
    for csv_row, pq, num in matched_questions:
        data.append({
            'csv_row': csv_row.get('text', ''),
            'pdf_num': num,
            'pdf_text': pq['text'],
            'pdf_a': pq.get('a',''),
            'pdf_b': pq.get('b',''),
            'pdf_c': pq.get('c',''),
            'csv_a': csv_row.get('optionA',''),
            'csv_b': csv_row.get('optionB',''),
            'csv_c': csv_row.get('optionC',''),
            'csv_d': csv_row.get('optionD',''),
            'syllabusRef': csv_row.get('syllabusRef',''),
            'subTopic': csv_row.get('subTopic',''),
            'difficulty': csv_row.get('difficulty',''),
            'index': csv_rows.index(csv_row),
        })
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"Saved matched pairs to: matched_qa_pairs.json")
