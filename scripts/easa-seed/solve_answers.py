"""Improved answer solver using corpus text with term frequency scoring."""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

CORPUS_DIR = Path(__file__).parent / "corpus"
CSV_DIR = Path(__file__).parent / "csvs"


def load_corpus(module: str) -> list[dict]:
    path = CORPUS_DIR / f"{module}.jsonl"
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def tokenize(text: str) -> set[str]:
    """Extract meaningful tokens from text."""
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    # Remove common stop words
    stop_words = {"the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "has", "have", "had", "this", "that", "with", "from", "they", "been", "said", "each", "which", "their", "will", "other", "about", "many", "some", "time", "very", "when", "make", "like", "long", "look", "more", "come", "made", "may", "its", "how", "before", "after", "also"}
    return {w for w in words if w not in stop_words}


def get_relevant_paragraphs(question: str, options: list[str], corpus: list[dict], top_n: int = 10) -> list[str]:
    """Get corpus paragraphs most relevant to the question and options."""
    q_tokens = tokenize(question)
    opt_tokens = set()
    for opt in options:
        opt_tokens.update(tokenize(opt))
    
    all_search_tokens = q_tokens | opt_tokens
    
    scored = []
    for rec in corpus:
        text = rec.get("text", "")
        para_tokens = tokenize(text)
        overlap = len(all_search_tokens & para_tokens)
        # Bonus for exact phrase matches
        for opt in options:
            if len(opt) > 10 and opt.lower() in text.lower():
                overlap += 5
        if overlap > 0:
            scored.append((overlap, text))
    
    scored.sort(key=lambda x: -x[0])
    return [t for _, t in scored[:top_n]]


def solve_question(question: str, options: list[str], paragraphs: list[str]) -> str | None:
    """Try to determine the correct answer from corpus paragraphs."""
    if not paragraphs:
        return None
    
    corpus_text = " ".join(paragraphs).lower()
    
    # Score each option by term frequency in corpus
    scores = []
    for i, opt in enumerate(options):
        opt_tokens = tokenize(opt)
        score = 0
        for token in opt_tokens:
            score += corpus_text.count(token)
        # Bonus for exact match
        if len(opt) > 5 and opt.lower() in corpus_text:
            score += 20
        scores.append((score, i))
    
    scores.sort(key=lambda x: -x[0])
    
    if len(scores) >= 2:
        top_score = scores[0][0]
        second_score = scores[1][0]
        # Require a meaningful difference
        if top_score >= 3 and top_score >= second_score * 1.3:
            return chr(ord("A") + scores[0][1])
    
    return None


def solve_module(module: str) -> None:
    csv_path = CSV_DIR / f"{module}.csv"
    if not csv_path.exists():
        print(f"{module}: no CSV found")
        return
    
    corpus = load_corpus(module)
    if not corpus:
        print(f"{module}: no corpus found")
        return
    
    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    solved = 0
    for row in rows:
        if row.get("correctAnswer"):
            continue
        question = row.get("text", "")
        options = [row.get("optionA", ""), row.get("optionB", ""), row.get("optionC", ""), row.get("optionD", "")]
        options = [o for o in options if o.strip()]
        
        if len(options) < 2:
            continue
        
        paragraphs = get_relevant_paragraphs(question, options, corpus)
        answer = solve_question(question, options, paragraphs)
        
        if answer:
            idx = ord(answer) - ord("A")
            if idx < len(options):
                row["correctAnswer"] = answer
                row["status"] = "APPROVED"
                row["reviewNote"] = ""
                solved += 1
    
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    total = len(rows)
    with_ans = sum(1 for r in rows if r["correctAnswer"])
    print(f"{module}: solved {solved} questions, {with_ans}/{total} now have answers")


def main() -> int:
    import sys
    only = sys.argv[1] if len(sys.argv) > 1 else None
    modules = ["M8", "M9", "M10"] if not only else [only]
    for mod in modules:
        solve_module(mod)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
