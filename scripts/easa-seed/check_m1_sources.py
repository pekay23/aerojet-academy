import csv
from pathlib import Path

for path in [
    Path(__file__).parent / "M1_final.csv",
    Path(__file__).parent / "csvs" / "M1.csv",
    Path(__file__).parent / "csvs_answered" / "M1.csv",
]:
    if path.exists():
        rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
        count = sum(1 for r in rows if r.get("correctAnswer", "").strip())
        print(f"{path}: {len(rows)} rows, {count} answers")
