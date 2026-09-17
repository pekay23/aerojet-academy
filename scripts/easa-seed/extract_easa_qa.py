import sys
sys.stdout.reconfigure(encoding='utf-8')
import re, os, json

# Load the full easa book text
with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\easa_book_full.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all "Answer: X-Y" entries and extract the answer text
# Pattern: "Answer: X-Y" followed by answer text, until the next "Answer:" or section break
answer_pattern = re.compile(r'Answer:\s*(\d+)-(\d+)\s*\n(.*?)(?=\nAnswer:|\n\d+\.\d+\s|\nSUB-MODULE|\nPage|\Z)', re.DOTALL)
all_answers = {}
for m in answer_pattern.finditer(text):
    key = f"{m.group(1)}-{m.group(2)}"
    answer_text = m.group(3).strip()
    # Clean up
    answer_text = re.sub(r'\s+', ' ', answer_text)
    all_answers[key] = answer_text

print(f"Extracted {len(all_answers)} answers")
for key, val in sorted(all_answers.items(), key=lambda x: (int(x[0].split('-')[0]), int(x[0].split('-')[1])))[:30]:
    print(f"  {key}: {val[:100]}")

# Now let's find the questions in the easa book
# Questions follow a pattern like "X.Y" followed by question text and options a/b/c
# Let's search for question blocks
# Pattern: "X.Y" at start of line, followed by content until options
question_pattern = re.compile(r'(?:^|\n)(\d+\.\d+)\s+(?:Knowledge Requirements|Questions)?\s*\n(.*?)(?=\n\d+\.\d+|\nSUB-MODULE|\Z)', re.DOTALL | re.MULTILINE)
questions = {}
for m in question_pattern.finditer(text):
    key = m.group(1)
    q_text = m.group(2).strip()
    q_text = re.sub(r'\s+', ' ', q_text)
    if len(q_text) > 5:
        questions[key] = q_text

print(f"\nExtracted {len(questions)} question blocks")
for key, val in list(questions.items())[:10]:
    print(f"  Q{key}: {val[:150]}")
