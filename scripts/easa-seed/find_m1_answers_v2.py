#!/usr/bin/env python3
"""
Comprehensive M1 answer-finding script.
Strategy: Use all available text sources to find answers for unanswered questions.
"""
import csv, json, re, math, os, sys

# === Load all source texts ===
doc_text_dir = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1'
corpus_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl'
csv_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'

# Load all doc-text files
all_texts = {}
for fname in sorted(os.listdir(doc_text_dir)):
    if fname.endswith('.txt'):
        fpath = os.path.join(doc_text_dir, fname)
        try:
            with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                all_texts[fname] = f.read()
        except:
            pass

# Load suntech corpus
corpus_entries = []
try:
    with open(corpus_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                corpus_entries.append(json.loads(line))
except:
    pass

# === Load CSV ===
with open(csv_path, 'r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    records = list(reader)
    fieldnames = reader.fieldnames

print(f"Total records: {len(records)}")
print(f"Total text files loaded: {len(all_texts)}")
print(f"Corpus entries: {len(corpus_entries)}")

# === Build answer key from Module 1 Answers.txt ===
# Format: "Test N Answers" -> "Question :N" -> "The correct answer is a/b/c"
m1_answers_text = all_texts.get('Module 1 Answers.txt', '')
answer_key = {}  # (test_num, question_num) -> 'a'|'b'|'c'

current_test = None
for line in m1_answers_text.split('\n'):
    line_stripped = line.strip()
    # Match "Test N Answers"
    test_match = re.match(r'Test\s+(\d+)\s+Answers', line_stripped, re.IGNORECASE)
    if test_match:
        current_test = int(test_match.group(1))
        continue
    # Match "Question :N"
    q_match = re.match(r'Question\s*:\s*(\d+)', line_stripped, re.IGNORECASE)
    if q_match and current_test:
        current_q = int(q_match.group(1))
        continue
    # Match "The correct answer is a/b/c"
    ans_match = re.match(r'The\s+correct\s+answer\s+is\s+([abc])', line_stripped, re.IGNORECASE)
    if ans_match and current_test and current_q:
        answer_key[(current_test, current_q)] = ans_match.group(1).lower()

print(f"\nModule 1 Answers.txt: extracted {len(answer_key)} answer entries")
for k in sorted(answer_key.keys())[:5]:
    print(f"  Test {k[0]}, Q{k[1]}: {answer_key[k]}")

# === Build answer key from DGCA files ===
# Format: "Question Number. N." -> "Correct Answer is. X"
dgca_answer_keys = {}  # (source_file, question_num) -> answer

for fname, content in all_texts.items():
    if fname.startswith('DGCA'):
        current_q_num = None
        for line in content.split('\n'):
            q_match = re.match(r'Question\s+Number\s*\.?\s*\.?\s*(\d+)\.?\s*(.*)', line.strip(), re.IGNORECASE)
            if q_match:
                current_q_num = int(q_match.group(1))
                q_text = q_match.group(2).strip()
                continue
            ans_match = re.match(r'[Cc]orrect\s+[Aa]nswer\s+is\.?\s*\.?\s*(.+?)(?:\s*\n|$)', line.strip())
            if ans_match and current_q_num is not None:
                ans_text = ans_match.group(1).strip().rstrip('.')
                dgca_answer_keys[(fname, current_q_num)] = ans_text

print(f"\nDGCA answer entries: {len(dgca_answer_keys)}")

# === Now process each unanswered question ===
# First let's see what we found
results = {}  # rowIndex -> (answer, confidence, source, note)

# Load unanswered questions
for record in records:
    ca = (record.get('correctAnswer', '') or '').strip()
    if not ca or ca == 'NEEDS_ANSWER':
        # This is unanswered
        pass

# Let me print the answer keys to understand the pattern better
print("\n=== Module 1 Answers (first 10) ===")
for k in sorted(answer_key.keys())[:10]:
    print(f"  Test {k[0]} Q{k[1]}: {answer_key[k]}")

print("\n=== DGCA answers (first 10) ===")
for k in sorted(dgca_answer_keys.keys())[:10]:
    print(f"  {k[0]} Q{k[1]}: {dgca_answer_keys[k]}")
