import re
from pathlib import Path

doc_dir = Path(__file__).parent / "doc-text" / "M1"
files = [
    "AEROJET M1 SAMPLE TEST 1 WITH ANSWERS_230822_090600.txt",
    "AEROJET M1 SAMPLE TEST 2 WITH ANSWERS_230822_101228.txt",
    "AEROJET M1 SAMPLE SET 4 WITH ANSWERS R_230828_092734.txt",
    "AEROJET M1  MOCK  AUG TT3 EXTRA 1_230817_091323.txt",
]

for fname in files:
    fpath = doc_dir / fname
    if not fpath.exists():
        continue
    text = fpath.read_text(encoding="utf-8", errors="ignore")
    lines = text.split("\n")
    t_lines = [i for i, line in enumerate(lines) if re.match(r"^T\s+[A-Za-z0-9]\s*$", line.strip())]
    q_count = sum(1 for line in lines if re.match(r"^\d+\.\s+\S", line.strip()))
    print(f"{fname}: {q_count} questions, {len(t_lines)} 'T X' markers")
