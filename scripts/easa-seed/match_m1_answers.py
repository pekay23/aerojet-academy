"""Match M1 CSV questions to answers from Module 1 Answers.txt.

Strategy:
1. Parse Module 1 Questions.txt to extract all questions with their test numbers
2. Parse Module 1 Answers.txt to extract all answers with their test numbers
3. For each CSV question from Module 1 Questions.doc, find the best matching question
4. Assign the answer from the matched test

Also handle:
- 1.doc questions (match by content to answer key tests)
- Documents with embedded answers (sample tests with answers)
- Computable math answers
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).parent
CSV_PATH = ROOT / "csvs" / "M1.csv"
ANSWERS_PATH = ROOT / "m1_answers.json"
QUESTIONS_TXT = ROOT / "doc-text" / "M1" / "Module 1 Questions.txt"
OUT_PATH = ROOT / "csvs" / "M1_answered.csv"


def normalize_text(text: str) -> str:
    """Normalize question text for matching."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_questions_txt(path: Path) -> list[dict]:
    """Parse Module 1 Questions.txt into a list of {test_num, q_num, text, options}."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    questions = []
    current_test = None
    current_q_num = None
    current_lines = []

    lines = text.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Detect exam header
        m = re.match(r"Practice\s+Exam\s+(\d+)", line, re.IGNORECASE)
        if m:
            current_test = int(m.group(1))
            i += 1
            continue

        # Detect question number
        m = re.match(r"^(\d+)\.\s+(.+)$", line)
        if m and current_test is not None:
            # Save previous question if any
            if current_q_num is not None and current_lines:
                questions.append({
                    "test_num": current_test,
                    "q_num": current_q_num,
                    "text": " ".join(current_lines),
                })
            current_q_num = int(m.group(1))
            current_lines = [m.group(2)]
            i += 1
            continue

        # Collect option lines
        if current_q_num is not None:
            m_opt = re.match(r"^[a-dA-D]\)\s*(.+)$", line)
            if m_opt:
                current_lines.append(m_opt.group(1))
            elif line and not re.match(r"^Module\s+\d+", line, re.IGNORECASE):
                # continuation of question text or option
                if not re.match(r"^[A-Da-d]\s+[A-Z]", line):
                    current_lines.append(line)

        i += 1

    # Save last question
    if current_q_num is not None and current_lines:
        questions.append({
            "test_num": current_test,
            "q_num": current_q_num,
            "text": " ".join(current_lines),
        })

    return questions


def find_best_match(csv_q_text: str, parsed_questions: list[dict], threshold: float = 0.6) -> dict | None:
    """Find the best matching parsed question for a CSV question."""
    norm_csv = normalize_text(csv_q_text)
    best = None
    best_score = 0

    for pq in parsed_questions:
        norm_pq = normalize_text(pq["text"])
        score = SequenceMatcher(None, norm_csv, norm_pq).ratio()
        if score > best_score:
            best_score = score
            best = pq

    if best and best_score >= threshold:
        return {**best, "score": best_score}
    return None


def match_m1_questions():
    answers = json.loads(ANSWERS_PATH.read_text(encoding="utf-8"))
    parsed_qs = parse_questions_txt(QUESTIONS_TXT)
    print(f"Parsed {len(parsed_qs)} questions from Module 1 Questions.txt")
    print(f"Loaded {len(answers)} answers from Module 1 Answers.txt")

    rows = []
    matched = 0
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            src = row.get("sourceFile", "")
            correct = row.get("correctAnswer", "")
            if correct:
                # Already has an answer
                rows.append(row)
                continue

            # Try matching for questions from Module 1 Questions.doc or 1.doc
            if src in {"Module 1 Questions.doc", "1.doc"}:
                q_text = row.get("text", "")
                match = find_best_match(q_text, parsed_qs)
                if match:
                    test_key = f"test{match['test_num']}_q{match['q_num']}"
                    ans = answers.get(test_key)
                    if ans:
                        row["correctAnswer"] = ans["letter"]
                        row["reviewNote"] = f"Matched from Module 1 Answers.txt (Test {match['test_num']} Q{match['q_num']}, score={match['score']:.2f})"
                        matched += 1
                        rows.append(row)
                        continue

            # For other sources, mark as needs review
            row["reviewNote"] = "NEEDS_ANSWER — answer not provided in source; solve via Suntech corpus or admin review"
            rows.append(row)

    # Write updated CSV
    if rows:
        fieldnames = list(rows[0].keys())
        with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    print(f"Matched {matched} questions to answer key")
    print(f"Total rows: {len(rows)}")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    match_m1_questions()
