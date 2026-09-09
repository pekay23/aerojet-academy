"""Optimized M1 processor - fast version."""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).parent
DOC_DIR = ROOT / "doc-text" / "M1"
CSV_PATH = ROOT / "csvs" / "M1.csv"
ANSWERS_PATH = ROOT / "m1_answers.json"
OUT_PATH = ROOT / "csvs" / "M1_final.csv"


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_questions_txt(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    questions = []
    current_test = None
    current_q_num = None
    current_lines = []
    for line in text.split("\n"):
        line = line.strip()
        m = re.match(r"Practice\s+Exam\s+(\d+)", line, re.IGNORECASE)
        if m:
            if current_q_num and current_lines:
                questions.append({"test": current_test, "q": current_q_num, "text": " ".join(current_lines)})
            current_test = int(m.group(1))
            current_q_num = None
            current_lines = []
            continue
        m = re.match(r"^(\d+)\.\s+(.+)$", line)
        if m and current_test:
            if current_q_num and current_lines:
                questions.append({"test": current_test, "q": current_q_num, "text": " ".join(current_lines)})
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
        questions.append({"test": current_test, "q": current_q_num, "text": " ".join(current_lines)})
    return questions


def parse_1_txt(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    questions = []
    current_exam = None
    current_q_num = None
    current_lines = []
    for line in text.split("\n"):
        line = line.strip()
        m = re.match(r"Exam\s+(\d+)", line, re.IGNORECASE)
        if m:
            if current_q_num and current_lines:
                questions.append({"exam": current_exam, "q": current_q_num, "text": " ".join(current_lines)})
            current_exam = int(m.group(1))
            current_q_num = None
            current_lines = []
            continue
        m = re.match(r"^(\d+)\.\s+(.+)$", line)
        if m and current_exam:
            if current_q_num and current_lines:
                questions.append({"exam": current_exam, "q": current_q_num, "text": " ".join(current_lines)})
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
        questions.append({"exam": current_exam, "q": current_q_num, "text": " ".join(current_lines)})
    return questions


def compute_answer(question: str, options: list[str]) -> str | None:
    q = question.lower()
    if "tangent of 90" in q or "tan 90" in q:
        for i, opt in enumerate(options):
            if "infinity" in opt.lower() or "undefined" in opt.lower():
                return chr(65 + i)
    if "binary" in q and "decimal" in q:
        bin_match = re.search(r"([01]+)", question)
        if bin_match:
            try:
                decimal = int(bin_match.group(1), 2)
                for i, opt in enumerate(options):
                    if str(decimal) in opt:
                        return chr(65 + i)
            except ValueError:
                pass
    if "hexadecimal" in q and "decimal" in q:
        hex_match = re.search(r"(?<![A-Fa-f0-9])([A-Fa-f0-9]+)(?![A-Fa-f0-9])", question)
        if hex_match:
            try:
                decimal = int(hex_match.group(1), 16)
                for i, opt in enumerate(options):
                    if str(decimal) in opt:
                        return chr(65 + i)
            except ValueError:
                pass
    if "volume" in q and "cuboid" in q:
        dims = re.findall(r"(\d+(?:\.\d+)?)\s*(cm|m|mm|ft|in)", question)
        if len(dims) >= 3:
            vol = 1
            for d, _ in dims[:3]:
                vol *= float(d)
            for i, opt in enumerate(options):
                opt_num = re.search(r"(\d+(?:\.\d+)?)", opt.replace(",", ""))
                if opt_num and abs(float(opt_num.group(1)) - vol) < 0.01:
                    return chr(65 + i)
    if "area" in q and "rectangle" in q:
        dims = re.findall(r"(\d+(?:\.\d+)?)\s*(cm|m|mm|ft|in)", question)
        if len(dims) >= 2:
            area = float(dims[0][0]) * float(dims[1][0])
            for i, opt in enumerate(options):
                opt_num = re.search(r"(\d+(?:\.\d+)?)", opt.replace(",", ""))
                if opt_num and abs(float(opt_num.group(1)) - area) < 0.01:
                    return chr(65 + i)
    if "ratio of" in q and ":" in q:
        ratio_match = re.search(r"ratio of\s+(\d+)\s*:\s*(\d+)", q)
        if ratio_match:
            a, b = int(ratio_match.group(1)), int(ratio_match.group(2))
            for i, opt in enumerate(options):
                opt_match = re.search(r"(\d+)\s*:\s*(\d+)", opt)
                if opt_match:
                    oa, ob = int(opt_match.group(1)), int(opt_match.group(2))
                    if oa * b == ob * a:
                        return chr(65 + i)
    return None


def main():
    print("Loading answer key...")
    answers = json.loads(ANSWERS_PATH.read_text(encoding="utf-8"))
    parsed_qs = parse_questions_txt(DOC_DIR / "Module 1 Questions.txt")
    parsed_1 = parse_1_txt(DOC_DIR / "1.txt")
    print(f"  {len(parsed_qs)} questions from Module 1 Questions.txt")
    print(f"  {len(parsed_1)} questions from 1.txt")
    
    print("Loading CSV...")
    rows = list(csv.DictReader(open(CSV_PATH, "r", encoding="utf-8")))
    total = len(rows)
    print(f"  {total} rows")
    
    matched = 0
    for idx, row in enumerate(rows):
        if idx % 50 == 0:
            print(f"  Processing {idx}/{total}...")
        
        if row.get("correctAnswer", "").strip():
            continue
        
        src = row.get("sourceFile", "")
        q_text = row.get("text", "")
        options = [row.get("optionA", ""), row.get("optionB", ""), row.get("optionC", ""), row.get("optionD", "")]
        options = [o for o in options if o.strip()]
        
        # Strategy 1: Compute answer
        comp = compute_answer(q_text, options)
        if comp:
            row["correctAnswer"] = comp
            row["reviewNote"] = "Computed from question data"
            matched += 1
            continue
        
        # Strategy 2: Match to Module 1 Questions.txt answer key
        if src in {"Module 1 Questions.doc"}:
            norm_q = normalize(q_text)
            best = None
            best_score = 0
            for pq in parsed_qs:
                score = SequenceMatcher(None, norm_q, normalize(pq["text"])).ratio()
                if score > best_score:
                    best_score = score
                    best = pq
            if best and best_score >= 0.45:
                test_key = f"test{best['test']}_q{best['q']}"
                ans = answers.get(test_key)
                if ans:
                    row["correctAnswer"] = ans["letter"]
                    row["reviewNote"] = f"Matched from Module 1 Answers.txt (Test {best['test']} Q{best['q']}, score={best_score:.2f})"
                    matched += 1
                    continue
        
        # Strategy 3: Match to 1.txt
        if src == "1.doc":
            norm_q = normalize(q_text)
            best = None
            best_score = 0
            for pq in parsed_1:
                score = SequenceMatcher(None, norm_q, normalize(pq["text"])).ratio()
                if score > best_score:
                    best_score = score
                    best = pq
            if best and best_score >= 0.45:
                test_key = f"test{best['exam']}_q{best['q']}"
                ans = answers.get(test_key)
                if ans:
                    row["correctAnswer"] = ans["letter"]
                    row["reviewNote"] = f"Matched from 1.doc Exam {best['exam']} Q{best['q']} via answer key (score={best_score:.2f})"
                    matched += 1
                    continue
    
    fieldnames = list(rows[0].keys())
    with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    final_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"\nMatched {matched} additional questions")
    print(f"Total: {total}, Has answer: {final_has}, Needs answer: {total - final_has}")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    main()
