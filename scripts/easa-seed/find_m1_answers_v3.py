#!/usr/bin/env python3
"""
Comprehensive M1 answer-finding script.
Handles all 167 unanswered questions by:
1. Matching Module 1 Questions.doc to Module 1 Answers.txt
2. Extracting DGCA inline answers
3. Computing straightforward math problems
4. Searching all text sources
"""
import csv, json, re, math, os, sys

doc_text_dir = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1'
corpus_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl'
csv_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'

# === Load all text files ===
all_texts = {}
for fname in sorted(os.listdir(doc_text_dir)):
    if fname.endswith('.txt'):
        fpath = os.path.join(doc_text_dir, fname)
        try:
            with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                all_texts[fname] = f.read()
        except:
            pass

# Load corpus
corpus_text = ''
corpus_entries = []
try:
    with open(corpus_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                entry = json.loads(line)
                corpus_entries.append(entry)
                corpus_text += entry.get('text', '') + '\n'
except:
    pass

# === Load CSV ===
with open(csv_path, 'r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    records = list(reader)
    fieldnames = reader.fieldnames

unanswered = []
for i, r in enumerate(records):
    ca = (r.get('correctAnswer', '') or '').strip()
    if not ca or ca == 'NEEDS_ANSWER':
        unanswered.append((i, r))

print(f"Total: {len(records)}, Unanswered: {len(unanswered)}")

# === Strategy 1: Parse Module 1 Answers.txt ===
# Format: "Test N Answers" -> "Question :N" -> "The correct answer is a/b/c"
m1_answers = all_texts.get('Module 1 Answers.txt', '')
m1_answer_key = {}  # (test_num, q_num) -> answer letter (a/b/c)
current_test = None
current_q = None
for line in m1_answers.split('\n'):
    ls = line.strip()
    test_match = re.match(r'Test\s+(\d+)\s+Answers', ls, re.IGNORECASE)
    if test_match:
        current_test = int(test_match.group(1))
        continue
    q_match = re.match(r'Question\s*:\s*(\d+)', ls, re.IGNORECASE)
    if q_match and current_test:
        current_q = int(q_match.group(1))
        continue
    ans_match = re.match(r'The\s+correct\s+answer\s+is\s+([abc])', ls, re.IGNORECASE)
    if ans_match and current_test and current_q:
        m1_answer_key[(current_test, current_q)] = ans_match.group(1).lower()

# === Strategy 2: Parse Module 1 Questions.txt to map question text to test/qnum ===
# Format: "Practice Exam N" -> questions numbered 1-10
m1_questions = all_texts.get('Module 1 Questions.txt', '')
# Extract practice exam sections
exam_sections = re.split(r'Practice Exam\s+(\d+)', m1_questions)
# exam_sections[0] = intro, then alternating: number, content
m1_q_to_test = {}  # question text keywords -> (test_num, q_num)
for idx in range(1, len(exam_sections), 2):
    test_num = int(exam_sections[idx])
    content = exam_sections[idx + 1] if idx + 1 < len(exam_sections) else ''
    # Split by question numbers
    questions = re.split(r'\n\s*(\d+)\.\s', content)
    # Process questions
    q_lines = content.split('\n')
    current_q_num = None
    current_q_text = ''
    for line in q_lines:
        q_match = re.match(r'\s*(\d+)\.\s+(.*)', line)
        if q_match:
            if current_q_num and current_q_text:
                m1_q_to_test[current_q_text[:100]] = (test_num, current_q_num)
            current_q_num = int(q_match.group(1))
            current_q_text = q_match.group(2).strip()
        elif current_q_num:
            current_q_text += ' ' + line.strip()
    if current_q_num and current_q_text:
        m1_q_to_test[current_q_text[:100]] = (test_num, current_q_num)

print(f"M1 Questions mapped: {len(m1_q_to_test)} entries")

# === Helper to match option letter to option value ===
def get_option(record, letter):
    """Get option value by letter a/A/b/B/c/C"""
    opt_map = {'a': 'optionA', 'b': 'optionB', 'c': 'optionC', 'd': 'optionD'}
    key = opt_map.get(letter.lower())
    if key:
        return (record.get(key, '') or '').strip()
    return ''

# === Strategy 3: Parse DGCA files for Q&A pairs ===
# Format: "Question Number. N." -> "Correct Answer is. X"
dgca_extracts = {}  # question_text -> answer_text
for fname, content in all_texts.items():
    if not fname.startswith('DGCA'):
        continue
    lines = content.split('\n')
    current_q_num = None
    current_q_lines = []
    for line in lines:
        q_match = re.match(r'Question\s+Number\s*\.?\s*\.?\s*(\d+)\.?\s*(.*)', line.strip())
        if q_match:
            if current_q_num and current_q_lines:
                q_text = ' '.join(line.strip() for line in current_q_lines)
                dgca_extracts[q_text[:100]] = current_q_num
            current_q_num = int(q_match.group(1))
            current_q_lines = [q_match.group(2)] if q_match.group(2) else []
            continue
        ans_match = re.search(r'[Cc]orrect\s+[Aa]nswer\s+is\.?\s*\.?\s*(.+)', line)
        if ans_match and current_q_num:
            ans_text = ans_match.group(1).strip().rstrip('.')
            if current_q_lines:
                q_text = ' '.join(l.strip() for l in current_q_lines)
                dgca_extracts[q_text[:100]] = (current_q_num, ans_text)
            current_q_lines = []
            current_q_num = None

# === Strategy 4: Parse EASA files for Q&A pairs ===
# EASA files have format: "N) question" followed by answer options, then answer
easa_extracts = {}
for fname, content in all_texts.items():
    if not fname.startswith('EASA'):
        continue
    lines = content.split('\n')
    current_q = None
    q_lines = []
    for line in lines:
        # Match question patterns like "172) If 20% of 120..."
        q_match = re.match(r'\s*(\d+)\)\s*(.*)', line.strip())
        if q_match:
            if current_q and q_lines:
                q_text = ' '.join(l.strip() for l in q_lines)
                # Look for answer in the collected text
                full_text = q_text
                easa_extracts[full_text[:100]] = current_q
            current_q = int(q_match.group(1))
            q_lines = [q_match.group(2)]
            continue
        if current_q:
            q_lines.append(line)

# === Now process each unanswered question ===
answers_found = {}
for row_idx, record in unanswered:
    raw_json = record.get('rawJson', '')
    try:
        raw = json.loads(raw_json) if raw_json else {}
    except:
        raw = {}
    
    # Get full question from rawJson
    q_text = raw.get('question', record.get('text', ''))
    q_full = raw.get('raw', '')  # Contains full question + options
    options = raw.get('options', [])
    source = raw.get('source_file', record.get('sourceFile', ''))
    
    # Strategy 1: Module 1 Questions.doc -> Module 1 Answers.txt
    if 'Module 1 Questions.doc' in source:
        # Try to find which test and question this belongs to
        # Search in Module 1 Questions.txt for matching question text
        q_keywords = q_text[:80].lower()
        for q_key, (test_num, q_num) in m1_q_to_test.items():
            if q_keywords[:30] in q_key.lower() or q_key.lower()[:30] in q_keywords:
                if (test_num, q_num) in m1_answer_key:
                    ans_letter = m1_answer_key[(test_num, q_num)]
                    ans_value = get_option(record, ans_letter)
                    answers_found[row_idx] = (ans_value, 'HIGH', f'M1 Answers.txt Test {test_num} Q{q_num}', f'Answer {ans_letter})')
                    break
        
    # Strategy 2: DGCA source files -> inline answers
    if row_idx not in answers_found and source.startswith('DGCA'):
        for q_key, val in dgca_extracts.items():
            if isinstance(val, tuple):
                q_num, ans_text = val
                # Try to match question text
                if q_text[:50].lower() in q_key.lower() or q_key.lower()[:50] in q_text.lower():
                    # Match answer text to options
                    for opt in options:
                        if opt and ans_text.lower() in opt.lower() or opt.lower() in ans_text.lower():
                            answers_found[row_idx] = (opt, 'HIGH', f'{source} inline', f'Q{q_num}: {ans_text}')
                            break
                    if row_idx not in answers_found:
                        answers_found[row_idx] = (ans_text, 'MEDIUM', f'{source} inline', f'Q{q_num}: {ans_text}')
                        
    # Strategy 3: EASA files -> inline answers  
    if row_idx not in answers_found and source.startswith('EASA'):
        # Search the EASA text for the question
        easa_text = all_texts.get(source.replace('.pdf', '.txt'), '')
        # Try to find the question number from rawJson
        q_match = re.search(r'(\d+)\)', q_full)
        if q_match:
            q_num = q_match.group(1)
            # Search for this question number in EASA text
            pattern = rf'{q_num}\)\s*(.+?)(?=\n\s*\d+\)|\n\s*A\.|\Z)'
            found = re.search(pattern, easa_text, re.DOTALL)
            if found:
                block = found.group(1)
                # Look for answer options or answer key
                # In EASA files, the format seems to be question followed by options then next question
                # Answers are sometimes embedded in the text
                # Check if there's an answer marker
                ans_match = re.search(r'Answer.*?([abc])', block, re.IGNORECASE)
                if ans_match:
                    letter = ans_match.group(1).lower()
                    ans_val = get_option(record, letter)
                    if ans_val:
                        answers_found[row_idx] = (ans_val, 'HIGH', f'{source} inline', block[:100])
                        break

print(f"\nStrategy 1+2+3 found answers for: {len(answers_found)} questions")
for idx in sorted(answers_found.keys())[:20]:
    val, conf, src, note = answers_found[idx]
    qtext = records[idx].get('text', '')[:60]
    print(f"  Row {idx}: Q='{qtext}' -> {val} (conf={conf}, src={src})")
