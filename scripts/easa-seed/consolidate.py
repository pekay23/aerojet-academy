"""Consolidate extracted questions per module:
1. Combine all jsonl files for a module
2. Deduplicate via semhash (semantic) + text hash (exact)
3. Tag each question with an EASA LO code from the catalog
4. Output as CSV with EASA Part-66 columns

Output: scripts/easa-seed/csvs/<module_code>.csv
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
from pathlib import Path

OUT_DIR = Path(__file__).parent / "out"
CSV_DIR = Path(__file__).parent / "csvs"
CATALOG_PATH = Path(__file__).parent / "lo_catalog.json"
QUESTIONS_DIR = Path(__file__).parent / "questions_clean"
QUESTIONS_DIR.mkdir(parents=True, exist_ok=True)


def normalize_text(s: str) -> str:
    """Normalize for dedup comparison."""
    s = s.lower()
    s = re.sub(r"[\s\W_]+", " ", s)
    s = s.strip()
    return s


def hash_question(question: str, options: list[str]) -> str:
    """Stable hash of question + sorted options for exact dedup."""
    opts = sorted(o.lower().strip() for o in options)
    payload = question.lower().strip() + "|" + "|".join(opts)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


def load_all_questions() -> dict[str, list[dict]]:
    """Load all jsonl files from out/, grouped by module."""
    by_module: dict[str, list[dict]] = {}
    for path in OUT_DIR.rglob("*.jsonl"):
        module = path.parent.name
        if module not in {"M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M14", "M15", "M17"}:
            continue
        with path.open(encoding="utf-8") as f:
            for line in f:
                try:
                    q = json.loads(line)
                except json.JSONDecodeError:
                    continue
                q["module"] = module
                by_module.setdefault(module, []).append(q)
    return by_module


def dedup_exact(questions: list[dict]) -> list[dict]:
    """Drop identical questions (same text + options)."""
    seen: set[str] = set()
    out: list[dict] = []
    for q in questions:
        h = hash_question(q["question"], q["options"])
        if h in seen:
            continue
        seen.add(h)
        out.append(q)
    return out


def dedup_semantic(questions: list[dict], threshold: float = 0.85) -> list[dict]:
    """Use SemHash to drop near-duplicates.

    SemHash dedup returns a DeduplicationResult whose `selected` is the
    list of unique records (dicts when we pass a list of dicts).
    """
    if len(questions) <= 1:
        return questions
    try:
        from semhash import SemHash
    except Exception as exc:
        print(f"  semhash import failed: {exc}", file=sys.stderr)
        return questions
    records = [{"text": q["question"]} for q in questions]
    try:
        sh = SemHash.from_records(records, columns=["text"])
        result = sh.self_deduplicate(threshold=threshold)
        # selected is a list of dicts; match by 'text' field
        kept = {r["text"] for r in result.selected}
    except Exception as exc:
        print(f"  semhash dedup failed: {exc}", file=sys.stderr)
        return questions
    out: list[dict] = []
    for q in questions:
        if q["question"] in kept:
            out.append(q)
            kept.discard(q["question"])  # avoid duplicates within kept
    return out


def tag_lo(question: dict, catalog: list[dict]) -> str | None:
    """Assign the most likely LO code by term overlap.

    Falls back to category hint if present.
    """
    q_text = (question.get("question", "") + " " + " ".join(question.get("options", []))).lower()
    q_tokens = set(re.findall(r"\b[a-z]{3,}\b", q_text))
    category = (question.get("category") or "").lower()
    cat_tokens = set(re.findall(r"\b[a-z]{3,}\b", category))

    if not q_tokens and not cat_tokens:
        return None
    best_code: str | None = None
    best_score = 0.0
    for lo in catalog:
        title = lo["title"].lower()
        title_tokens = set(re.findall(r"\b[a-z]{3,}\b", title))
        if not title_tokens:
            continue
        # Question text overlap
        q_overlap = len(q_tokens & title_tokens)
        q_score = q_overlap / (1 + len(title_tokens) ** 0.5)
        # Category text overlap (stronger signal)
        c_overlap = len(cat_tokens & title_tokens) if cat_tokens else 0
        c_score = c_overlap * 2.0
        score = q_score + c_score
        if score > best_score and (q_overlap + c_overlap) >= 1:
            best_score = score
            best_code = lo["code"]
    return best_code


def estimate_level(question: dict, catalog_by_code: dict[str, dict]) -> int | None:
    """Use the catalogued level of the assigned LO; default None."""
    lo = question.get("syllabusRef")
    if lo and lo in catalog_by_code:
        return catalog_by_code[lo].get("level")
    return None


def estimate_difficulty(question: dict) -> str:
    """Heuristic difficulty based on question length and option count."""
    q_text = question.get("question", "")
    opts = question.get("options", [])
    if len(q_text) > 200 or len(opts) > 4:
        return "HARD"
    if len(q_text) < 50 and len(opts) == 3:
        return "EASY"
    return "MEDIUM"


def to_csv_row(q: dict, idx: int) -> dict:
    options = q.get("options", [])
    if len(options) < 2:
        return None
    correct = q.get("correct") or ""
    if correct and correct.isdigit():
        # Convert numeric 1-based to A/B/C/D
        try:
            i = int(correct) - 1
            if 0 <= i < len(options):
                correct = chr(ord("A") + i)
        except ValueError:
            pass
    row = {
        "module": q.get("module", ""),
        "syllabusRef": q.get("syllabusRef") or "",
        "level": q.get("level") if q.get("level") is not None else "",
        "text": q.get("question", "").strip(),
        "optionA": options[0] if len(options) > 0 else "",
        "optionB": options[1] if len(options) > 1 else "",
        "optionC": options[2] if len(options) > 2 else "",
        "optionD": options[3] if len(options) > 3 else "",
        "correctAnswer": correct,
        "difficulty": q.get("difficulty", "MEDIUM"),
        "subTopic": q.get("subTopic") or q.get("category") or "",
        "aiSourceRef": q.get("aiSourceRef") or "",
        "aiConfidence": q.get("aiConfidence") or "",
        "status": "APPROVED" if correct else "DRAFT",
        "reviewNote": "" if correct else "NEEDS_ANSWER — answer not provided in source; solve via Suntech corpus or admin review",
        "points": 1,
        "sourceFile": q.get("source_file", ""),
        "rawJson": json.dumps(q, ensure_ascii=False),
    }
    return row


def main() -> int:
    only = sys.argv[1] if len(sys.argv) > 1 else None
    catalog: dict[str, list[dict]] = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    catalog_by_code: dict[str, dict] = {}
    for m_los in catalog.values():
        for lo in m_los:
            catalog_by_code[lo["code"]] = lo

    by_module = load_all_questions()
    total_pre = 0
    total_post = 0
    summary: list[tuple[str, int, int, int, int]] = []
    CSV_DIR.mkdir(parents=True, exist_ok=True)

    for module in sorted(by_module):
        if only and module != only:
            continue
        qs = by_module[module]
        pre = len(qs)
        total_pre += pre
        # Step 1: exact dedup
        qs = dedup_exact(qs)
        exact = len(qs)
        # Step 2: semantic dedup
        qs = dedup_semantic(qs)
        # Step 3: LO tagging
        for q in qs:
            code = tag_lo(q, catalog.get(module, []))
            if code:
                q["syllabusRef"] = code
                q["level"] = estimate_level(q, catalog_by_code)
            q["difficulty"] = estimate_difficulty(q)
        # Step 4: write CSV
        out_path = CSV_DIR / f"{module}.csv"
        rows = []
        for i, q in enumerate(qs, 1):
            row = to_csv_row(q, i)
            if row is None:
                continue
            rows.append(row)
        if rows:
            with out_path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
        post = len(rows)
        total_post += post
        # Count how many have answers
        with_ans = sum(1 for r in rows if r["correctAnswer"])
        summary.append((module, pre, exact, post, with_ans))
        print(f"{module}: {pre} raw -> {exact} exact-dedup -> {post} semantic-dedup ({with_ans} with answers)")

    print(f"\nTOTAL: {total_pre} raw -> {total_post} unique")
    print(f"\nCSVs written to {CSV_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
