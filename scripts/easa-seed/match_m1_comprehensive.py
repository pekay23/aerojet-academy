"""Comprehensive M1 answer extraction and matching.

Handles:
1. Module 1 Answers.txt (test-based answer key)
2. WITH ANSWERS PDFs (extract Q+A pairs)
3. Embedded answer markers like "T 5" in PDFs
4. Fuzzy matching to CSV questions
"""
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
QUESTIONS_TXT = DOC_DIR / "Module 1 Questions.txt"
OUT_PATH = ROOT / "csvs" / "M1_answered.csv"


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def parse_with_answers_pdf(path: Path) -> list[dict]:
    """Parse a 'WITH ANSWERS' PDF to extract Q&A pairs.
    
    Handles patterns like:
    - "T 5" after options (answer marker)
    - "A. opt\nB. opt\nC. opt\nT X" 
    - Bold answers
    """
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.split("\n")
    qas = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Look for question start (numbered)
        m = re.match(r"^(\d+)\.\s+(.+)$", line)
        if m:
            q_num = int(m.group(1))
            q_text = m.group(2)
            options = {}
            answer_marker = None
            
            j = i + 1
            while j < len(lines) and j < i + 20:
                nxt = lines[j].strip()
                if not nxt:
                    j += 1
                    continue
                # Check for answer marker "T X" or "Answer: X"
                if re.match(r"^T\s+[A-Da-d]\s*$", nxt):
                    answer_marker = nxt.split()[1].upper()
                    j += 1
                    break
                if re.match(r"^(Answer|Ans|Correct)\s*[:\-]?\s*[A-Da-d]", nxt, re.IGNORECASE):
                    answer_marker = re.search(r"[A-Da-d]", nxt).group(0).upper()
                    j += 1
                    break
                # Check for option
                m_opt = re.match(r"^([A-Da-d])[\.\)]\s*(.+)$", nxt)
                if m_opt:
                    options[m_opt.group(1).upper()] = m_opt.group(2)
                    j += 1
                    continue
                # Stop if we hit another question
                if re.match(r"^\d+\.\s+\S", nxt):
                    break
                j += 1
            
            if options and answer_marker:
                qas.append({
                    "q_num": q_num,
                    "text": q_text,
                    "options": options,
                    "answer": answer_marker,
                    "source": path.name,
                })
            i = j
            continue
        i += 1
    
    return qas


def parse_embedded_answers(path: Path) -> list[dict]:
    """Parse documents with embedded answer markers like 'T 5'."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.split("\n")
    qas = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Look for question start
        m = re.match(r"^(\d+)\.\s+(.+)$", line)
        if m:
            q_num = int(m.group(1))
            q_text = m.group(2)
            options = {}
            answer_marker = None
            raw_lines = [line]
            
            j = i + 1
            while j < len(lines) and j < i + 25:
                nxt = lines[j].strip()
                raw_lines.append(nxt)
                if not nxt:
                    j += 1
                    continue
                # Check for T X pattern (common in Aerojet PDFs)
                m_t = re.match(r"^T\s+([A-Da-d])\s*$", nxt)
                if m_t:
                    answer_marker = m_t.group(1).upper()
                    j += 1
                    break
                # Check for bold answer pattern
                if re.match(r"^\*\*([A-Da-d])", nxt):
                    answer_marker = nxt[2].upper()
                    j += 1
                    break
                # Option
                m_opt = re.match(r"^([A-Da-d])[\.\)]\s*(.+)$", nxt)
                if m_opt:
                    options[m_opt.group(1).upper()] = m_opt.group(2)
                    j += 1
                    continue
                # Next question
                if re.match(r"^\d+\.\s+\S", nxt) and q_text:
                    break
                j += 1
            
            if answer_marker:
                qas.append({
                    "q_num": q_num,
                    "text": q_text,
                    "options": options,
                    "answer": answer_marker,
                    "source": path.name,
                    "raw": " ".join(raw_lines),
                })
            i = j
            continue
        i += 1
    
    return qas


def build_answer_bank() -> dict[str, str]:
    """Build a comprehensive answer bank for M1 from all available sources."""
    bank = {}  # normalized_question_text -> answer_letter
    
    # 1. From Module 1 Answers.txt (220 answers for Tests 1-22)
    answers = json.loads(ANSWERS_PATH.read_text(encoding="utf-8"))
    parsed_qs = parse_questions_txt(QUESTIONS_TXT)
    for pq in parsed_qs:
        test_key = f"test{pq['test_num']}_q{pq['q_num']}"
        ans = answers.get(test_key)
        if ans:
            norm = normalize(pq["text"])
            bank[norm] = ans["letter"]
    
    # 2. From WITH ANSWERS PDFs
    with_answers_files = [
        "AEROJET M1 SAMPLE TEST 1 WITH ANSWERS_230822_090600.txt",
        "AEROJET M1 SAMPLE TEST 2 WITH ANSWERS_230822_101228.txt",
        "AEROJET M1 SAMPLE SET 4 WITH ANSWERS R_230828_092734.txt",
    ]
    for fname in with_answers_files:
        fpath = DOC_DIR / fname
        if fpath.exists():
            qas = parse_with_answers_pdf(fpath)
            for qa in qas:
                norm = normalize(qa["text"])
                bank[norm] = qa["answer"]
    
    # 3. From documents with embedded answer markers
    embedded_files = [
        "AEROJET M1  MOCK  AUG TT3 EXTRA 1_230817_091323.txt",
    ]
    for fname in embedded_files:
        fpath = DOC_DIR / fname
        if fpath.exists():
            qas = parse_embedded_answers(fpath)
            for qa in qas:
                norm = normalize(qa["text"])
                bank[norm] = qa["answer"]
    
    return bank


def parse_questions_txt(path: Path) -> list[dict]:
    """Parse Module 1 Questions.txt to get questions with test numbers."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    questions = []
    current_test = None
    current_q_num = None
    current_lines = []

    lines = text.split("\n")
    for line in lines:
        line = line.strip()
        m = re.match(r"Practice\s+Exam\s+(\d+)", line, re.IGNORECASE)
        if m:
            if current_q_num is not None and current_lines:
                questions.append({
                    "test_num": current_test,
                    "q_num": current_q_num,
                    "text": " ".join(current_lines),
                })
            current_test = int(m.group(1))
            current_q_num = None
            current_lines = []
            continue

        m = re.match(r"^(\d+)\.\s+(.+)$", line)
        if m and current_test is not None:
            if current_q_num is not None and current_lines:
                questions.append({
                    "test_num": current_test,
                    "q_num": current_q_num,
                    "text": " ".join(current_lines),
                })
            current_q_num = int(m.group(1))
            current_lines = [m.group(2)]
            continue

        if current_q_num is not None:
            m_opt = re.match(r"^[a-dA-D]\)\s*(.+)$", line)
            if m_opt:
                current_lines.append(m_opt.group(1))
            elif line and not re.match(r"^Module\s+\d+", line, re.IGNORECASE):
                if not re.match(r"^[A-Da-d]\s+[A-Z]", line):
                    current_lines.append(line)

    if current_q_num is not None and current_lines:
        questions.append({
            "test_num": current_test,
            "q_num": current_q_num,
            "text": " ".join(current_lines),
        })

    return questions


def main():
    bank = build_answer_bank()
    print(f"Built answer bank with {len(bank)} entries")
    
    rows = []
    matched = 0
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            correct = row.get("correctAnswer", "").strip()
            if correct:
                rows.append(row)
                continue
            
            q_text = row.get("text", "")
            norm_q = normalize(q_text)
            
            # Try direct match
            if norm_q in bank:
                row["correctAnswer"] = bank[norm_q]
                row["reviewNote"] = "Verified from source document answer key"
                matched += 1
                rows.append(row)
                continue
            
            # Try fuzzy match
            best_letter = None
            best_score = 0
            for bank_q, letter in bank.items():
                score = SequenceMatcher(None, norm_q, bank_q).ratio()
                if score > best_score:
                    best_score = score
                    best_letter = letter
            
            if best_letter and best_score >= 0.7:
                row["correctAnswer"] = best_letter
                row["reviewNote"] = f"Fuzzy matched from source document (score={best_score:.2f})"
                matched += 1
                rows.append(row)
                continue
            
            # No match found
            row["reviewNote"] = "NEEDS_ANSWER — answer not provided in source; solve via Suntech corpus or admin review"
            rows.append(row)
    
    if rows:
        fieldnames = list(rows[0].keys())
        with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    total = len(rows)
    print(f"Matched {matched}/{total} questions")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    main()
