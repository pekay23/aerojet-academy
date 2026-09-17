import csv
from pathlib import Path

out_dir = Path(__file__).parent / "csvs_answered"
path = out_dir / "M4.csv"

if path.exists():
    rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
    has_ans = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    print(f"M4: {has_ans}/{len(rows)} answered")
    
    # Check for any updates
    for r in rows[:5]:
        print(f"  Q: {r['text'][:60]}...")
        print(f"  A: {r.get('correctAnswer', 'NONE')}")
        print(f"  Note: {r.get('reviewNote', 'NONE')[:60]}...")
        print()
else:
    print("M4.csv not found")
