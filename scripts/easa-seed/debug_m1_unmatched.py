import csv, re, json
from pathlib import Path
from difflib import SequenceMatcher

def normalize(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

ROOT = Path(__file__).parent
csv_path = ROOT / "csvs" / "M1_answered.csv"
answers = json.loads((ROOT / "m1_answers.json").read_text(encoding="utf-8"))

# Parse Module 1 Questions.txt
questions_txt = (ROOT / "doc-text" / "M1" / "Module 1 Questions.txt").read_text(encoding="utf-8", errors="ignore")
parsed_qs = []
current_test = None
current_q_num = None
current_lines = []

for line in questions_txt.split("\n"):
    line = line.strip()
    m = re.match(r"Practice\s+Exam\s+(\d+)", line, re.IGNORECASE)
    if m:
        if current_q_num and current_lines:
            parsed_qs.append({"test": current_test, "q": current_q_num, "text": " ".join(current_lines)})
        current_test = int(m.group(1))
        current_q_num = None
        current_lines = []
        continue
    m = re.match(r"^(\d+)\.\s+(.+)$", line)
    if m and current_test:
        if current_q_num and current_lines:
            parsed_qs.append({"test": current_test, "q": current_q_num, "text": " ".join(current_lines)})
        current_q_num = int(m.group(1))
        current_lines = [m.group(2)]
        continue
    if current_q_num:
        m_opt = re.match(r"^[a-dA-D]\)\s*(.+)$", line)
        if m_opt:
            current_lines.append(m_opt.group(1))
        elif line and not re.match(r"^Module\s+\d+", line, re.IGNORECASE):
            if not re.match(r"^[A-Da-d]\s+[A-Z]", line):
                current_lines.append(line)
if current_q_num and current_lines:
    parsed_qs.append({"test": current_test, "q": current_q_num, "text": " ".join(current_lines)})

print(f"Parsed {len(parsed_qs)} questions from Module 1 Questions.txt")

rows = list(csv.DictReader(open(csv_path, "r", encoding="utf-8")))
module1_rows = [r for r in rows if r["sourceFile"] == "Module 1 Questions.doc" and not r.get("correctAnswer", "").strip()]
print(f"Unmatched Module 1 Questions.doc rows: {len(module1_rows)}")

for row in module1_rows[:10]:
    q_text = row["text"]
    norm_q = normalize(q_text)
    best = None
    best_score = 0
    for pq in parsed_qs:
        score = SequenceMatcher(None, norm_q, normalize(pq["text"])).ratio()
        if score > best_score:
            best_score = score
            best = pq
    if best:
        test_key = f"test{best['test']}_q{best['q']}"
        ans = answers.get(test_key)
        print(f"  Q: {q_text[:60]}...")
        print(f"  Best match: Test {best['test']} Q{best['q']} (score={best_score:.3f}) -> {ans['letter'] if ans else 'NO ANSWER'}")
        print()
