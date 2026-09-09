import csv
from collections import Counter
from pathlib import Path

csv_path = Path(__file__).parent / "csvs" / "M1.csv"
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

counts = Counter(r["sourceFile"] for r in rows)
print(f"Total M1 questions: {len(rows)}")
for src, cnt in counts.most_common():
    print(f"  {src}: {cnt}")
