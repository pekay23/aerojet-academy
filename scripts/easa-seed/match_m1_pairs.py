"""Match M1 questions using WITH/WITHOUT ANSWERS pairs and embedded answers."""
from __future__ import annotations

import csv
import re
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).parent
DOC_DIR = ROOT / "doc-text" / "M1"
CSV_PATH = ROOT / "csvs" / "M1_answered.csv"
OUT_PATH = ROOT / "csvs" / "M1_answered2.csv"


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_questions_from_text(text: str) -> list[dict]:
    """Extract questions from document text. Returns list of {num, text, options, answer?}."""
    lines = text.split("\n")
    questions = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = re.match(r"^(\d+)\.\s+(.+)$", line)
        if m:
            q_num = int(m.group(1))
            q_text = m.group(2)
            options = {}
            answer = None
            j = i + 1
            while j < len(lines) and j < i + 25:
                nxt = lines[j].strip()
                if not nxt:
                    j += 1
                    continue
                # Answer marker patterns
                m_t = re.match(r"^T\s+([A-Da-d])\s*$", nxt)
                if m_t:
                    answer = m_t.group(1).upper()
                    j += 1
                    break
                m_ans = re.match(r"^(Answer|Ans|Correct)\s*[:\-]?\s*([A-Da-d])", nxt, re.IGNORECASE)
                if m_ans:
                    answer = m_ans.group(2).upper()
                    j += 1
                    break
                m_opt = re.match(r"^([A-Da-d])[\.\)]\s*(.+)$", nxt)
                if m_opt:
                    options[m_opt.group(1).upper()] = m_opt.group(2)
                    j += 1
                    continue
                if re.match(r"^\d+\.\s+\S", nxt):
                    break
                j += 1
            
            questions.append({
                "num": q_num,
                "text": q_text,
                "options": options,
                "answer": answer,
            })
            i = j
            continue
        i += 1
    return questions


def match_questions(without_qs: list[dict], with_qs: list[dict], threshold: float = 0.75) -> dict[int, str]:
    """Match questions from WITHOUT ANSWERS to WITH ANSWERS documents."""
    mapping = {}
    for wq in without_qs:
        norm_w = normalize(wq["text"])
        best_match = None
        best_score = 0
        for bq in with_qs:
            norm_b = normalize(bq["text"])
            score = SequenceMatcher(None, norm_w, norm_b).ratio()
            if score > best_score:
                best_score = score
                best_match = bq
        if best_match and best_score >= threshold and best_match.get("answer"):
            mapping[wq["num"]] = best_match["answer"]
    return mapping


def main():
    rows = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Loaded {len(rows)} rows")
    already_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"Already has answers: {already_has}")
    
    # Group rows by source file
    from collections import defaultdict
    by_src = defaultdict(list)
    for r in rows:
        by_src[r["sourceFile"]].append(r)
    
    # Define WITH/WITHOUT pairs
    pairs = [
        # (without_source, with_source)
        ("AEROJET M1 SAMPLE TEST 1 WITHOUT ANSWERS_230822_081651.pdf",
         "AEROJET M1 SAMPLE TEST 1 WITH ANSWERS_230822_090600.pdf"),
        ("AEROJET M1 SAMPLE TEST 2 WITHOUT ANSWERS (1)_230822_094249.pdf",
         "AEROJET M1 SAMPLE TEST 2 WITH ANSWERS_230822_101228.pdf"),
        ("AEROJET M1 SAMPLE SET 4 WITHOUT ANSWERS_230828_082029.pdf",
         "AEROJET M1 SAMPLE SET 4 WITH ANSWERS R_230828_092734.pdf"),
    ]
    
    matched = 0
    for without_src, with_src in pairs:
        without_rows = by_src.get(without_src, [])
        with_path = DOC_DIR / with_src.replace(".pdf", ".txt")
        if not with_path.exists():
            print(f"  SKIP: {with_path} not found")
            continue
        
        with_text = with_path.read_text(encoding="utf-8", errors="ignore")
        with_qs = parse_questions_from_text(with_text)
        print(f"  {with_src}: {len(with_qs)} questions parsed")
        
        for row in without_rows:
            if row.get("correctAnswer", "").strip():
                continue
            q_text = row.get("text", "")
            # Try to match by question number first
            q_num_match = re.match(r"^(\d+)", q_text)
            if q_num_match:
                q_num = int(q_num_match.group(1))
                for bq in with_qs:
                    if bq["num"] == q_num and bq.get("answer"):
                        row["correctAnswer"] = bq["answer"]
                        row["reviewNote"] = f"Matched from {with_src} Q{q_num}"
                        matched += 1
                        break
                else:
                    # Try fuzzy match
                    norm_q = normalize(q_text)
                    best = None
                    best_score = 0
                    for bq in with_qs:
                        score = SequenceMatcher(None, norm_q, normalize(bq["text"])).ratio()
                        if score > best_score:
                            best_score = score
                            best = bq
                    if best and best_score >= 0.7 and best.get("answer"):
                        row["correctAnswer"] = best["answer"]
                        row["reviewNote"] = f"Fuzzy matched from {with_src} (score={best_score:.2f})"
                        matched += 1
    
    # Handle embedded answers in MOCK AUG TT3 EXTRA 1
    mock_src = "AEROJET M1  MOCK  AUG TT3 EXTRA 1_230817_091323.pdf"
    mock_path = DOC_DIR / mock_src.replace(".pdf", ".txt")
    if mock_path.exists():
        mock_text = mock_path.read_text(encoding="utf-8", errors="ignore")
        mock_qs = parse_questions_from_text(mock_text)
        answered_qs = [q for q in mock_qs if q.get("answer")]
        print(f"  {mock_src}: {len(answered_qs)} questions with embedded answers")
        
        for row in by_src.get(mock_src, []):
            if row.get("correctAnswer", "").strip():
                continue
            q_text = row.get("text", "")
            q_num_match = re.match(r"^(\d+)", q_text)
            if q_num_match:
                q_num = int(q_num_match.group(1))
                for aq in answered_qs:
                    if aq["num"] == q_num:
                        row["correctAnswer"] = aq["answer"]
                        row["reviewNote"] = f"Embedded answer from {mock_src} Q{q_num}"
                        matched += 1
                        break
            else:
                norm_q = normalize(q_text)
                best = None
                best_score = 0
                for aq in answered_qs:
                    score = SequenceMatcher(None, norm_q, normalize(aq["text"])).ratio()
                    if score > best_score:
                        best_score = score
                        best = aq
                if best and best_score >= 0.7 and best.get("answer"):
                    row["correctAnswer"] = best["answer"]
                    row["reviewNote"] = f"Fuzzy matched embedded answer from {mock_src} (score={best_score:.2f})"
                    matched += 1
    
    # Write updated CSV
    fieldnames = list(rows[0].keys())
    with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    total = len(rows)
    final_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"\nMatched {matched} additional questions")
    print(f"Total: {total}, Has answer: {final_has}, Needs answer: {total - final_has}")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    main()
