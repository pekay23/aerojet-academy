import csv
from collections import Counter
from pathlib import Path

rows = list(csv.DictReader(open(Path(__file__).parent / "csvs" / "M7.csv", "r", encoding="utf-8")))
print("Total:", len(rows))
print("Has answer:", sum(1 for r in rows if r.get("correctAnswer", "").strip()))
print("Sources:", Counter(r["sourceFile"] for r in rows).most_common())
print("First 3 with answers:")
for r in rows[:3]:
    print(f"  Q: {r['text'][:60]}...")
    print(f"  A: {r.get('correctAnswer', 'NONE')}")
    print(f"  Source: {r['sourceFile']}")
