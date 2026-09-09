"""Use Suntech corpus to answer remaining M1 and M2 questions."""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).parent
OUT_DIR = ROOT / "csvs_answered"


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def search_corpus(question: str, corpus_path: Path, top_k: int = 3) -> list[str]:
    """Search corpus for relevant passages."""
    if not corpus_path.exists():
        return []
    
    norm_q = normalize(question)
    q_words = set(norm_q.split())
    # Remove common words
    stop_words = {"what", "is", "the", "of", "and", "a", "an", "in", "to", "for", "are", "how", "does", "do", "can", "which", "when", "where", "why"}
    q_words = q_words - stop_words
    if not q_words:
        return []
    
    passages = []
    with open(corpus_path, "r", encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
                text = entry.get("text", "")
                norm_text = normalize(text)
                # Count matching keywords
                matches = sum(1 for w in q_words if w in norm_text)
                if matches >= 2:
                    passages.append((matches, text))
            except Exception:
                continue
    
    passages.sort(key=lambda x: x[0], reverse=True)
    return [p[1] for p in passages[:top_k]]


def answer_from_corpus(question: str, options: list[str], passages: list[str]) -> str | None:
    """Try to determine answer from corpus passages."""
    if not passages:
        return None
    
    norm_options = [normalize(opt) for opt in options]
    
    for passage in passages:
        norm_passage = normalize(passage)
        for i, opt in enumerate(norm_options):
            # Check if the option text (or key words from it) appears in the passage
            opt_words = set(opt.split()) - stop_words
            if len(opt_words) >= 2:
                matches = sum(1 for w in opt_words if w in norm_passage)
                if matches >= max(2, len(opt_words) // 2):
                    return chr(65 + i)
    
    return None


def process_module(module: str, corpus_name: str):
    csv_path = OUT_DIR / f"{module}.csv"
    if not csv_path.exists():
        return
    
    rows = list(csv.DictReader(open(csv_path, "r", encoding="utf-8")))
    corpus_path = ROOT / "corpus" / f"{corpus_name}.jsonl"
    
    matched = 0
    for row in rows:
        if row.get("correctAnswer", "").strip():
            continue
        
        q_text = row.get("text", "")
        options = [row.get("optionA", ""), row.get("optionB", ""), row.get("optionC", ""), row.get("optionD", "")]
        options = [o for o in options if o.strip()]
        
        passages = search_corpus(q_text, corpus_path)
        answer = answer_from_corpus(q_text, options, passages)
        if answer:
            row["correctAnswer"] = answer
            row["reviewNote"] = "Found in Suntech corpus"
            matched += 1
    
    if matched > 0:
        fieldnames = list(rows[0].keys())
        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    final_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"{module}: matched {matched} from corpus, total {final_has}/{len(rows)}")


# Stop words for answer_from_corpus
stop_words = {"what", "is", "the", "of", "and", "a", "an", "in", "to", "for", "are", "how", "does", "do", "can", "which", "when", "where", "why"}

if __name__ == "__main__":
    process_module("M1", "M1")
    process_module("M2", "M2")
