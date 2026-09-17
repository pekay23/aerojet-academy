import csv
from pathlib import Path
from collections import Counter

csv_path = Path(__file__).parent / "csvs" / "M1_answered.csv"
with open(csv_path, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

total = len(rows)
has_answer = sum(1 for r in rows if r.get("correctAnswer", "").strip())
needs_answer = total - has_answer

print(f"Total: {total}, Has answer: {has_answer}, Needs answer: {needs_answer}")

# Breakdown by source for those WITHOUT answers
needs_by_src = Counter(r["sourceFile"] for r in rows if not r.get("correctAnswer", "").strip())
print("\nNeeds answer by source:")
for src, cnt in needs_by_src.most_common():
    print(f"  {src}: {cnt}")

# Breakdown by source for those WITH answers
has_by_src = Counter(r["sourceFile"] for r in rows if r.get("correctAnswer", "").strip())
print("\nHas answer by source:")
for src, cnt in has_by_src.most_common():
    print(f"  {src}: {cnt}")
