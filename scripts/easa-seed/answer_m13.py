
import csv, json, re, time, os
from collections import defaultdict

CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'
DOC_TEXT_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M13\exams q.txt'
CORPUS_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13.jsonl'
CORPUS_TEXT_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13_text.txt'
INDEX_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M13_index.json'

start = time.time()

stop_words = {'what', 'how', 'why', 'when', 'where', 'which', 'who', 'is', 'are', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'for', 'and', 'or', 'not', 'does', 'do', 'did', 'can', 'could', 'would', 'should', 'has', 'have', 'had', 'been', 'was', 'were', 'will', 'shall', 'may', 'might', 'must', 'this', 'that', 'these', 'those', 'with', 'from', 'by', 'about', 'as', 'at', 'but', 'into', 'than', 'too', 'very', 'just', 'also', 'now', 'up', 'out', 'if', 'or', 'because', 'until', 'while', 'each', 'all', 'any', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same', 'so', 'then', 'there', 'through', 'under', 'until', 'while', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'his', 'her', 'its', 'their'}

# Build or load corpus text
if os.path.exists(CORPUS_TEXT_PATH):
    with open(CORPUS_TEXT_PATH, 'r', encoding='utf-8') as f:
        corpus_text = f.read()
    print(f'Loaded corpus text: {len(corpus_text)} chars')
else:
    with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
        corpus_text = '\n'.join(json.loads(line).get('text', '') for line in f if line.strip())
    with open(CORPUS_TEXT_PATH, 'w', encoding='utf-8') as f:
        f.write(corpus_text)
    print(f'Saved corpus text: {len(corpus_text)} chars')

# Build inverted index
if os.path.exists(INDEX_PATH):
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        index = json.load(f)
    print(f'Loaded index with {len(index)} terms')
else:
    print('Building inverted index...')
    lines = corpus_text.split('\n')
    index = defaultdict(list)
    for line_idx, line in enumerate(lines):
        words = set(re.sub(r'[^a-zA-Z0-9]', ' ', line.lower()).split())
        words -= stop_words
        for w in words:
            if len(w) > 2:
                index[w].append((line_idx, line))
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(dict(index), f)
    print(f'Built index with {len(index)} terms')

# Read doc text Q&A
with open(DOC_TEXT_PATH, 'r', encoding='utf-8') as f:
    doc_lines = f.readlines()

qa_map = {}
current_q = None
current_a_lines = []

def is_question(line):
    line = line.strip()
    if not line or line.startswith('---') or line.startswith('•') or line.startswith('-'):
        return False
    if '?' in line:
        return True
    for s in ['what ', 'how ', 'why ', 'when ', 'where ', 'which ', 'who ', 'are ', 'is ', 'does ', 'do ', 'can ']:
        if line.lower().startswith(s):
            return True
    return False

for line in doc_lines:
    stripped = line.strip()
    if not stripped or stripped.startswith('---'):
        if current_q and current_a_lines:
            qa_map[current_q] = ' '.join(current_a_lines).strip()
        current_q = None
        current_a_lines = []
        continue
    if is_question(stripped):
        if current_q and current_a_lines:
            qa_map[current_q] = ' '.join(current_a_lines).strip()
        current_q = stripped.rstrip('?')
        current_a_lines = []
    else:
        if current_q is not None:
            current_a_lines.append(stripped)

if current_q and current_a_lines:
    qa_map[current_q] = ' '.join(current_a_lines).strip()

print(f'Doc Q&A map: {len(qa_map)} entries')

# Read CSV
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

print(f'Questions: {len(rows)}')

def normalize(text):
    return re.sub(r'[^a-zA-Z0-9\s]', '', text.lower()).strip()

def find_answer(row):
    q = row.get('text', '').strip()
    opts = [row.get('optionA', '').strip(), row.get('optionB', '').strip(),
            row.get('optionC', '').strip(), row.get('optionD', '').strip()]
    opts = [o for o in opts if o]
    
    q_norm = normalize(q)
    
    # Strategy 1: Doc text Q&A
    for doc_q, doc_a in qa_map.items():
        doc_q_norm = normalize(doc_q)
        if q_norm in doc_q_norm or doc_q_norm in q_norm:
            return doc_a, 'doc-text'
    
    # Strategy 2: Check if any option text appears in corpus
    for i, opt in enumerate(opts):
        opt_norm = normalize(opt)
        if len(opt_norm) > 15 and opt_norm in corpus_text.lower():
            return opt, 'corpus-option-direct'
    
    # Strategy 3: Use inverted index for option matching
    option_matches = {}
    for i, opt in enumerate(opts):
        opt_words = set(normalize(opt).split()) - stop_words
        if not opt_words:
            continue
        # Get candidate lines from index
        candidates = {}
        for w in opt_words:
            if w in index:
                for line_idx, line in index[w]:
                    candidates[line_idx] = line
        
        if not candidates:
            continue
            
        best_overlap = 0
        best_line = ''
        for line_idx, line in candidates.items():
            line_lower = line.lower()
            overlap = sum(1 for w in opt_words if w in line_lower)
            if overlap > best_overlap:
                best_overlap = overlap
                best_line = line
        
        if best_overlap >= max(2, len(opt_words) * 0.5):
            option_matches[i] = (best_overlap, best_line)
    
    if option_matches:
        best_i = max(option_matches, key=lambda k: option_matches[k][0])
        return opts[best_i], 'corpus-option-overlap'
    
    # Strategy 4: Question keyword matching using index
    keywords = [w for w in q_norm.split() if w not in stop_words and len(w) > 3]
    if len(keywords) < 3:
        keywords = [w for w in q_norm.split() if w not in stop_words and len(w) > 2]
    
    if keywords:
        candidates = {}
        for k in keywords:
            if k in index:
                for line_idx, line in index[k]:
                    candidates[line_idx] = line
        
        best_score = 0
        best_match = None
        for line_idx, line in candidates.items():
            line_lower = line.lower()
            score = sum(1 for k in keywords if k in line_lower)
            if score > best_score:
                best_score = score
                best_match = line
            if best_score >= len(keywords):
                break
        
        if best_score >= max(3, len(keywords) * 0.5) and best_match:
            return best_match, 'corpus'
    
    return None, None

answered = 0
needs = 0
results = []

for row in rows:
    if row.get('correctAnswer', '').strip():
        answered += 1
        results.append(row)
        continue
    
    ans, src = find_answer(row)
    
    if ans:
        opts = [row.get('optionA', '').strip(), row.get('optionB', '').strip(),
                row.get('optionC', '').strip(), row.get('optionD', '').strip()]
        opts = [o for o in opts if o]
        
        letter = ''
        for i, opt in enumerate(opts):
            if opt.lower() in ans.lower():
                letter = chr(65 + i)
                break
        
        if not letter and opts:
            for i, opt in enumerate(opts):
                opt_words = set(normalize(opt).split()) - stop_words
                if opt_words:
                    overlap = sum(1 for w in opt_words if w in ans.lower())
                    if overlap >= max(2, len(opt_words) * 0.5):
                        letter = chr(65 + i)
                        break
        
        row['correctAnswer'] = letter
        row['reviewNote'] = f'Matched from {src}'
        row['aiConfidence'] = 'MEDIUM' if letter else 'LOW'
        row['status'] = 'ANSWERED'
        answered += 1
    else:
        row['reviewNote'] = 'NEEDS_ANSWER - no match found'
        row['status'] = 'NEEDS_ANSWER'
        needs += 1
    
    results.append(row)

# Write
with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print(f'\\nDone in {time.time()-start:.2f}s')
print(f'Answered: {answered}, NEEDS_ANSWER: {needs}, Total: {len(rows)}')
