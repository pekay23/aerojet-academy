import csv
from pathlib import Path

csv_path = Path(__file__).parent / "csvs" / "M1_answered.csv"
rows = list(csv.DictReader(open(csv_path, "r", encoding="utf-8")))

module1_q_rows = [r for r in rows if r["sourceFile"] == "Module 1 Questions.doc"]
has_answer = [r for r in module1_q_rows if r.get("correctAnswer", "").strip()]
no_answer = [r for r in module1_q_rows if not r.get("correctAnswer", "").strip()]

print(f"Module 1 Questions.doc: {len(module1_q_rows)} total")
print(f"  Has answer: {len(has_answer)}")
print(f"  No answer: {len(no_answer)}")

print("\nFirst 5 WITH answers:")
for r in has_answer[:5]:
    print(f"  Q: {r['text'][:80]}...")
    print(f"  A: {r['correctAnswer']}")
    print()

print("\nFirst 5 WITHOUT answers:")
for r in no_answer[:5]:
    print(f"  Q: {r['text'][:80]}...")
    print(f"  A: {r.get('correctAnswer', 'NONE')}")
    print()
