import re
from pathlib import Path

text = Path(__file__).parent / "doc-text" / "M1" / "AEROJET M1 SAMPLE TEST 1 WITH ANSWERS_230822_090600.txt"
text = text.read_text(encoding="utf-8", errors="ignore")

lines = text.split("\n")
t_lines = []
for i, line in enumerate(lines):
    stripped = line.strip()
    if re.match(r"^T\s+[A-Za-z0-9]\s*$", stripped):
        t_lines.append((i, stripped))

print(f"Found {len(t_lines)} 'T X' answer markers in entire document")

# Also search for "Answer:" patterns
ans_lines = []
for i, line in enumerate(lines):
    stripped = line.strip()
    if re.match(r"^(Answer|Ans|Correct)\s*[:\-]?\s*[A-Za-z0-9]", stripped, re.IGNORECASE):
        ans_lines.append((i, stripped))

print(f"Found {len(ans_lines)} 'Answer:' patterns")

# Count questions
q_lines = []
for i, line in enumerate(lines):
    if re.match(r"^\d+\.\s+\S", line.strip()):
        q_lines.append(i)

print(f"Found {len(q_lines)} question starters")

# Check page markers
pages = [i for i, line in enumerate(lines) if "--- Page" in line]
print(f"Pages: {len(pages)}")
