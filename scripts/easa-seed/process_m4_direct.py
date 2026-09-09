"""Direct M4 processor - handle this smaller module directly."""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).parent
DOC_DIR = ROOT / "doc-text" / "M4"
CSV_PATH = ROOT / "csvs_answered" / "M4.csv"
OUT_PATH = ROOT / "csvs_answered" / "M4.csv"
CORPUS_PATH = ROOT / "corpus" / "M4.jsonl"


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def compute_answer(question: str, options: list[str]) -> str | None:
    q = question.lower()
    
    # Electronic fundamentals computations
    if "ohms law" in q or "ohm's law" in q:
        # V = I * R
        if "voltage" in q and "current" in q and "resistance" in q:
            v_match = re.search(r"(\d+(?:\.\d+)?)\s*v", q)
            i_match = re.search(r"(\d+(?:\.\d+)?)\s*a", q)
            r_match = re.search(r"(\d+(?:\.\d+)?)\s*ohm", q)
            if v_match and i_match:
                v = float(v_match.group(1))
                i = float(i_match.group(1))
                r = v / i
                for i_opt, opt in enumerate(options):
                    if str(round(r, 2)) in opt or str(round(r, 1)) in opt:
                        return chr(65 + i_opt)
    
    if "power" in q and ("watt" in q or "current" in q or "voltage" in q):
        # P = V * I or P = I^2 * R or P = V^2 / R
        v_match = re.search(r"(\d+(?:\.\d+)?)\s*v", q)
        i_match = re.search(r"(\d+(?:\.\d+)?)\s*a", q)
        r_match = re.search(r"(\d+(?:\.\d+)?)\s*ohm", q)
        if v_match and i_match:
            p = float(v_match.group(1)) * float(i_match.group(1))
            for i_opt, opt in enumerate(options):
                if str(round(p, 2)) in opt or str(round(p, 1)) in opt:
                    return chr(65 + i_opt)
    
    return None


def search_corpus(question: str, top_k: int = 3) -> list[str]:
    if not CORPUS_PATH.exists():
        return []
    
    norm_q = normalize(question)
    q_words = set(norm_q.split()) - {"what", "is", "the", "of", "and", "a", "an", "in", "to", "for", "are", "how", "does", "do", "can", "which", "when", "where", "why", "the"}
    if len(q_words) < 2:
        return []
    
    passages = []
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
                text = entry.get("text", "")
                norm_text = normalize(text)
                matches = sum(1 for w in q_words if w in norm_text)
                if matches >= 2:
                    passages.append((matches, text))
            except Exception:
                continue
    
    passages.sort(key=lambda x: x[0], reverse=True)
    return [p[1] for p in passages[:top_k]]


def answer_from_corpus(question: str, options: list[str], passages: list[str]) -> str | None:
    if not passages:
        return None
    
    norm_options = [normalize(opt) for opt in options]
    stop_words = {"what", "is", "the", "of", "and", "a", "an", "in", "to", "for", "are", "how", "does", "do", "can", "which", "when", "where", "why"}
    
    for passage in passages:
        norm_passage = normalize(passage)
        for i, opt in enumerate(norm_options):
            opt_words = set(opt.split()) - stop_words
            if len(opt_words) >= 2:
                matches = sum(1 for w in opt_words if w in norm_passage)
                if matches >= max(2, len(opt_words) // 2):
                    return chr(65 + i)
    return None


def main():
    print("Processing M4...")
    rows = list(csv.DictReader(open(CSV_PATH, "r", encoding="utf-8")))
    print(f"  Total rows: {len(rows)}")
    
    matched = 0
    for row in rows:
        if row.get("correctAnswer", "").strip():
            continue
        
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
        
        # Strategy 2: Search corpus
        passages = search_corpus(q_text)
        answer = answer_from_corpus(q_text, options, passages)
        if answer:
            row["correctAnswer"] = answer
            row["reviewNote"] = "Found in Suntech corpus"
            matched += 1
            continue
        
        # Keep as NEEDS_ANSWER
        row["reviewNote"] = "NEEDS_ANSWER — answer not provided in source; solve via Suntech corpus or admin review"
    
    fieldnames = list(rows[0].keys())
    with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    final_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"  Matched: {matched}")
    print(f"  Final: {final_has}/{len(rows)} answered")


if __name__ == "__main__":
    main()
