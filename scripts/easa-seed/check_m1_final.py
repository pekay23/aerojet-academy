import csv
from pathlib import Path

path = Path(__file__).parent / "csvs" / "M1_final.csv"
if path.exists():
    rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
    count = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"M1_final.csv: {len(rows)} rows, {count} answers")
else:
    print("M1_final.csv not found")
