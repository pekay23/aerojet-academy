"""Comprehensive answer processor for ALL EASA modules.

For each module:
1. Load the CSV
2. Build answer bank from available sources
3. Match questions to answers
4. Compute answers for math problems
5. Update CSV

This is a scaled-up version of the M1 processor.
"""
from __future__ import annotations

import csv
import json
import re
import subprocess
from pathlib import Path
from difflib import SequenceMatcher
from concurrent.futures import ProcessPoolExecutor, as_completed

ROOT = Path(__file__).parent
DOC_DIR = ROOT / "doc-text"
CSV_DIR = ROOT / "csvs"
OUT_DIR = ROOT / "csvs_answered"
OUT_DIR.mkdir(exist_ok=True)

MODULES = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

# Suntech training books (corpus) - key formulas and facts per module
CORPUS = {
    "M1": {
        "formulas": {
            "area of circle": "pi * r^2",
            "circumference": "2 * pi * r",
            "area of triangle": "0.5 * base * height",
            "pythagoras": "a^2 + b^2 = c^2",
            "tan 90": "undefined / infinity",
            "binary to decimal": "sum of bit * 2^position",
            "hex to decimal": "hex digit * 16^position",
        }
    }
}


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def compute_answer(question: str, options: list[str]) -> str | None:
    """Try to compute the answer for math/science questions."""
    q = question.lower()
    
    # Simple arithmetic checks
    if "tangent of 90" in q or "tan 90" in q:
        for i, opt in enumerate(options):
            if "infinity" in opt.lower() or "undefined" in opt.lower():
                return chr(65 + i)
    
    if "binary" in q and "decimal" in q:
        # Binary to decimal conversion
        bin_match = re.search(r"([01]+)", question)
        if bin_match:
            bin_str = bin_match.group(1)
            try:
                decimal = int(bin_str, 2)
                for i, opt in enumerate(options):
                    if str(decimal) in opt:
                        return chr(65 + i)
            except ValueError:
                pass
    
    if "hexadecimal" in q and "decimal" in q:
        hex_match = re.search(r"([0-9A-Fa-f]+)", question)
        if hex_match:
            hex_str = hex_match.group(1)
            try:
                decimal = int(hex_str, 16)
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
                # Check if option contains the volume
                opt_num = re.search(r"(\d+(?:\.\d+)?)", opt.replace(",", ""))
                if opt_num:
                    if abs(float(opt_num.group(1)) - vol) < 0.01:
                        return chr(65 + i)
    
    if "area" in q and "rectangle" in q:
        dims = re.findall(r"(\d+(?:\.\d+)?)\s*(cm|m|mm|ft|in)", question)
        if len(dims) >= 2:
            area = float(dims[0][0]) * float(dims[1][0])
            for i, opt in enumerate(options):
                opt_num = re.search(r"(\d+(?:\.\d+)?)", opt.replace(",", ""))
                if opt_num:
                    if abs(float(opt_num.group(1)) - area) < 0.01:
                        return chr(65 + i)
    
    return None


def process_module(module: str) -> dict:
    """Process a single module's CSV."""
    csv_path = CSV_DIR / f"{module}.csv"
    if not csv_path.exists():
        return {"module": module, "status": "skipped", "reason": "CSV not found"}
    
    rows = list(csv.DictReader(open(csv_path, "r", encoding="utf-8")))
    total = len(rows)
    already_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    
    matched = 0
    for row in rows:
        if row.get("correctAnswer", "").strip():
            continue
        
        q_text = row.get("text", "")
        options = [
            row.get("optionA", ""),
            row.get("optionB", ""),
            row.get("optionC", ""),
            row.get("optionD", ""),
        ]
        options = [o for o in options if o.strip()]
        
        # Try computation first
        comp = compute_answer(q_text, options)
        if comp:
            row["correctAnswer"] = comp
            row["reviewNote"] = "Computed from question data"
            matched += 1
            continue
    
    final_has = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    
    # Write output
    out_path = OUT_DIR / f"{module}.csv"
    if rows:
        fieldnames = list(rows[0].keys())
        with open(out_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    return {
        "module": module,
        "status": "done",
        "total": total,
        "already_had": already_has,
        "newly_matched": matched,
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
