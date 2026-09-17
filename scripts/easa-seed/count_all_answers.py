import csv
from pathlib import Path
from collections import Counter

root = Path(__file__).parent / "csvs"
modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

total_q = 0
total_with_answers = 0
by_module = {}

for mod in modules:
    csv_path = root / f"{mod}.csv"
    if not csv_path.exists():
        continue
    rows = list(csv.DictReader(open(csv_path, "r", encoding="utf-8")))
    total = len(rows)
    with_ans = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    
    # Count sources that likely have answers
    answer_sources = sum(1 for r in rows if any(kw in r.get("sourceFile", "").lower() 
                       for kw in ["answers", "answer key", "with answers"]))
    
    total_q += total
    total_with_answers += with_ans
    by_module[mod] = {"total": total, "has_answer": with_ans, "likely_answer_src": answer_sources}

print("Module breakdown:")
for mod, stats in by_module.items():
    print(f"  {mod}: {stats['total']} questions, {stats['has_answer']} have answers, {stats['likely_answer_src']} from answer sources")

print(f"\nTotal: {total_q} questions, {total_with_answers} have answers")
