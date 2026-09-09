import csv
from pathlib import Path

out_dir = Path(__file__).parent / "csvs_answered"
modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

total_q = 0
total_ans = 0
ready = []
pending = []

for mod in modules:
    path = out_dir / f"{mod}.csv"
    if not path.exists():
        pending.append(mod)
        continue
    rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
    has_ans = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    pct = 100 * has_ans / len(rows) if rows else 0
    total_q += len(rows)
    total_ans += has_ans
    if has_ans == len(rows):
        ready.append(mod)
    else:
        pending.append(f"{mod} ({has_ans}/{len(rows)})")

print("EASA Question Bank - Final Status")
print("=" * 50)
print(f"\nTotal: {total_ans}/{total_q} answered ({100*total_ans/total_q:.1f}%)")
print(f"\nReady for seeding ({len(ready)} modules): {', '.join(ready)}")
print(f"\nPending ({len(pending)} modules):")
for p in pending:
    print(f"  - {p}")
