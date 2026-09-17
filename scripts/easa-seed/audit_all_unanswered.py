"""Audit all unanswered questions across M1-M17."""
from __future__ import annotations

import csv
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

out_dir = Path(__file__).parent / "csvs_answered"
modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

print("Unanswered questions audit")
print("=" * 60)

total_unanswered = 0
total_questions = 0

for mod in modules:
    path = out_dir / f"{mod}.csv"
    if not path.exists():
        print(f"{mod}: MISSING")
        continue
    
    rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
    needs = [r for r in rows if not r.get("correctAnswer", "").strip()]
    total = len(rows)
    total_questions += total
    total_unanswered += len(needs)
    
    print(f"\n{mod}: {len(needs)}/{total} unanswered ({100*len(needs)/total:.1f}%)")
    
    # Show first 3 unanswered questions as samples
    for r in needs[:3]:
        text = r['text'][:70].replace('\n', ' ')
        print(f"  - {text}...")
    if len(needs) > 3:
        print(f"  ... and {len(needs) - 3} more")

print(f"\n{'=' * 60}")
print(f"TOTAL: {total_unanswered}/{total_questions} unanswered ({100*total_unanswered/total_questions:.1f}%)")
