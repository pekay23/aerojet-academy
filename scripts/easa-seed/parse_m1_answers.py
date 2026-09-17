"""Parse M1 Module 1 Answers.txt and produce answer mapping.

Output: scripts/easa-seed/answers/m1_answers.json
Format: { "1.1": "a", "1.2": "b", ... }  (question_index -> letter)
"""
import re, json
from pathlib import Path

SRC = Path(__file__).parent / "doc-text" / "M1" / "Module 1 Answers.txt"
OUT = Path(__file__).parent / "m1_answers.json"

text = SRC.read_text(encoding="utf-8", errors="ignore")

# Pattern: "Test N Answers" then "Question :X" then "The correct answer is a/b/c..."
# We'll build a flat list of (test_num, q_num, letter, explanation)
answers = {}

current_test = None
lines = text.split("\n")
i = 0
while i < len(lines):
    line = lines[i].strip()
    # Detect test header
    m = re.match(r"Test\s+(\d+)\s+Answers", line, re.IGNORECASE)
    if m:
        current_test = int(m.group(1))
        i += 1
        continue

    # Detect question header
    m = re.match(r"Question\s*:\s*(\d+)", line, re.IGNORECASE)
    if m and current_test is not None:
        q_num = int(m.group(1))
        # Look ahead for "The correct answer is X"
        explanation = []
        correct_letter = None
        j = i + 1
        while j < len(lines) and j < i + 5:
            nxt = lines[j].strip()
            if not nxt:
                j += 1
                continue
            if re.match(r"Test\s+\d+\s+Answers", nxt, re.IGNORECASE):
                break
            if re.match(r"Question\s*:\s*\d+", nxt, re.IGNORECASE):
                break
            m2 = re.search(r"The correct answer is\s+([a-dA-D])[\)\s\.]", nxt, re.IGNORECASE)
            if m2:
                correct_letter = m2.group(1).upper()
            explanation.append(nxt)
            j += 1

        if correct_letter:
            # Use a key like "test1_q1" to avoid collisions
            key = f"test{current_test}_q{q_num}"
            answers[key] = {
                "letter": correct_letter,
                "explanation": " ".join(explanation).strip(),
            }
        i = j
        continue

    i += 1

print(f"Parsed {len(answers)} answers from Module 1 Answers.txt")
OUT.write_text(json.dumps(answers, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Saved to {OUT}")

# Also print a sample
for k, v in list(answers.items())[:5]:
    print(f"  {k}: {v['letter']} - {v['explanation'][:80]}...")
