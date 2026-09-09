import re
from pathlib import Path

text = Path(__file__).parent / "doc-text" / "M1" / "Module 1 Questions.txt"
text = text.read_text(encoding="utf-8", errors="ignore")

# Find all exam headers
exams = re.findall(r"Practice\s+Exam\s+(\d+)", text)
print(f"Found {len(exams)} practice exams in Module 1 Questions.txt")
print(f"Exam numbers: {exams}")

# Count questions per exam by finding "1." patterns after each header
parts = re.split(r"Practice\s+Exam\s+\d+", text)
print(f"Parts: {len(parts)}")
for i, part in enumerate(parts[1:], 1):
    q_count = len(re.findall(r"^\s*\d+\.\s+\S", part, re.MULTILINE))
    print(f"  Exam {i}: ~{q_count} questions")
