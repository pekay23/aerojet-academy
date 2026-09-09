import csv
from pathlib import Path

path = Path(__file__).parent / "csvs_answered" / "M6.csv"
rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
total = len(rows)
has_answer = sum(1 for r in rows if r.get("correctAnswer", "").strip())
approved = sum(1 for r in rows if r.get("status", "").upper() == "APPROVED")
draft = sum(1 for r in rows if r.get("status", "").upper() == "DRAFT")

print(f"M6: {has_answer}/{total} answered")
print(f"  APPROVED: {approved}")
print(f"  DRAFT: {draft}")
print(f"  Status values: {set(r.get('status', '') for r in rows)}")
print(f"  Sample:")
for r in rows[:3]:
    print(f"    Q: {r['text'][:60]}...")
    print(f"    A: {r.get('correctAnswer', 'NONE')}")
    print(f"    Status: {r.get('status', 'NONE')}")
    print()
