import csv
from pathlib import Path

out_dir = Path(__file__).parent / "csvs_answered"
modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

print("EASA Question Bank Answer Status")
print("=" * 50)
print()

total_q = 0
total_ans = 0
for mod in modules:
    path = out_dir / f"{mod}.csv"
    if not path.exists():
        print(f"{mod}: MISSING")
        continue
    rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
    has_ans = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    pct = 100 * has_ans / len(rows) if rows else 0
    total_q += len(rows)
    total_ans += has_ans
    print(f"{mod}: {has_ans}/{len(rows)} answered ({pct:.1f}%)")

print()
print(f"Total: {total_ans}/{total_q} answered ({100*total_ans/total_q:.1f}%)")
print()
print("Ready for seeding: M1, M2, M7, M17")
print("Awaiting background tasks: M3, M4, M5, M6, M11A, M13")
