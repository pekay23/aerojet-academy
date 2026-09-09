import csv
from pathlib import Path

out_dir = Path(__file__).parent / "csvs_answered"
modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

print("Detailed CSV analysis:")
print("=" * 60)

for mod in modules:
    path = out_dir / f"{mod}.csv"
    if not path.exists():
        print(f"{mod}: MISSING")
        continue
    
    rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
    total = len(rows)
    has_answer = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    needs_answer = total - has_answer
    
    print(f"\n{mod}:")
    print(f"  Total rows: {total}")
    print(f"  Has answer: {has_answer}")
    print(f"  Needs answer: {needs_answer}")
    
    # Check for empty review notes or other issues
    empty_review = sum(1 for r in rows if not r.get("reviewNote", "").strip())
    print(f"  Empty review notes: {empty_review}")
