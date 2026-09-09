import csv
from pathlib import Path

out_dir = Path(__file__).parent / "csvs_answered"
modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

print("CSV row counts:")
for mod in modules:
    path = out_dir / f"{mod}.csv"
    if not path.exists():
        print(f"{mod}: MISSING")
        continue
    rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
    has_ans = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"{mod}: {len(rows)} rows, {has_ans} with answers")
