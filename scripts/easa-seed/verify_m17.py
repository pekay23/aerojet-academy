import csv
from pathlib import Path

path = Path(__file__).parent / "csvs_answered" / "M17.csv"
rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
total = len(rows)
has_answer = sum(1 for r in rows if r.get("correctAnswer", "").strip())
print(f"M17: {has_answer}/{total} answered")

# Show first 5
for r in rows[:5]:
    print(f"  Q: {r['text'][:60]}...")
    print(f"  A: {r.get('correctAnswer', 'NONE')}")
    print()
