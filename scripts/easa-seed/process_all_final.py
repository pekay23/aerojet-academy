"""Comprehensive answer processor for ALL modules."""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).parent
DOC_DIR = ROOT / "doc-text"
CSV_DIR = ROOT / "csvs"
OUT_DIR = ROOT / "csvs_answered"
OUT_DIR.mkdir(exist_ok=True)

MODULES = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


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


def parse_m2_answer_key(path: Path) -> dict[int, str]:
    """Parse M2 answer key grid format."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    answers = {}
    for line in text.split("\n"):
        # Match patterns like "1. *", "21. C", "98.B"
        matches = re.findall(r"(\d+)\.\s*([A-Za-z*])\b", line)
        for num, letter in matches:
            answers[int(num)] = letter.upper()
    return answers


def parse_m17_standard_test(path: Path) -> dict[int, str]:
    """Parse M17 standard test for answers."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    answers = {}
    # Look for answer patterns
    for line in text.split("\n"):
        m = re.match(r"(\d+)\.\s*(.+?)(?:\s+Answer[:\s]+([A-Da-d]))", line, re.IGNORECASE)
        if m:
            answers[int(m.group(1))] = m.group(3).upper()
    return answers


def process_module(module: str) -> dict:
    csv_path = CSV_DIR / f"{module}.csv"
    if not csv_path.exists():
        return {"module": module, "status": "skipped"}
    
    rows = list(csv.DictReader(open(csv_path, "r", encoding="utf-8")))
    total = len(rows)
    
    # Module-specific answer parsing
    answer_map = {}
    if module == "M2":
        ans_path = DOC_DIR / "M2" / "ANSWERS MODULE 02 QUESTIONS BANK BySFoS 2.txt"
        if ans_path.exists():
            answer_map = parse_m2_answer_key(ans_path)
            print(f"  M2: Parsed {len(answer_map)} answers from answer key")
    
    matched = 0
    for row in rows:
        if row.get("correctAnswer", "").strip():
            continue
        
        src = row.get("sourceFile", "")
        q_text = row.get("text", "")
        options = [row.get("optionA", ""), row.get("optionB", ""), row.get("optionC", ""), row.get("optionD", "")]
        options = [o for o in options if o.strip()]
        
        # Strategy 1: Module-specific answer map
        if module == "M2" and answer_map:
            q_num_match = re.match(r"^(\d+)", q_text)
            if q_num_match:
                q_num = int(q_num_match.group(1))
                if q_num in answer_map:
                    letter = answer_map[q_num]
                    if letter != "*":
                        row["correctAnswer"] = letter
                        row["reviewNote"] = f"From M2 answer key Q{q_num}"
                        matched += 1
                        continue
        
        # Strategy 2: Compute answer
        comp = compute_answer(q_text, options)
        if comp:
            row["correctAnswer"] = comp
            row["reviewNote"] = "Computed from question data"
            matched += 1
            continue
    
    # Write output
    out_path = OUT_DIR / f"{module}.csv"
    if rows:
        fieldnames = list(rows[0].keys())
        with open(out_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    final_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    return {
        "module": module,
        "total": total,
        "matched": matched,
        "final_has": final_has,
    }


def main():
    results = []
    for mod in MODULES:
        print(f"Processing {mod}...")
        result = process_module(mod)
        results.append(result)
        print(f"  {result}")
    
    print("\nSummary:")
    for r in results:
        print(f"  {r['module']}: {r.get('final_has', 0)}/{r.get('total', 0)} answered")


if __name__ == "__main__":
    main()
