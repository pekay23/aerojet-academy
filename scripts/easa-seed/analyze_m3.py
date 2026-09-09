import csv, json, math, re
from collections import Counter, defaultdict

csv_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv'

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered = [r for r in rows if not r.get('correctAnswer','').strip()]
answered = [r for r in rows if r.get('correctAnswer','').strip()]

print(f"Total rows: {len(rows)}")
print(f"Answered: {len(answered)}")
print(f"Unanswered: {len(unanswered)}")

# Show answer distribution
ans_counts = Counter(r['correctAnswer'] for r in answered)
print(f"Answer distribution: {dict(ans_counts)}")

# Sample unanswered questions
print("\n--- Sample unanswered (first 20) ---")
for r in unanswered[:20]:
    opts = [r['optionA'], r['optionB'], r['optionC'], r.get('optionD','')]
    opts_str = [f"{chr(65+i)}) {o[:60] if o else ''}" for i, o in enumerate(opts)]
    print(f"  Q: {r['text'][:100]}")
    print(f"    {', '.join(opts_str)}")
    print(f"    reviewNote: {r.get('reviewNote','')[:80]}")
    print()

# Check subTopic / syllabusRef distribution
subtopics = Counter(r.get('subTopic','') for r in unanswered)
print(f"\nSubtopic distribution (unanswered): {dict(sorted(subtopics.items(), key=lambda x: -x[1]))}")

syllabus = Counter(r.get('syllabusRef','') for r in unanswered)
print(f"\nSyllabus distribution (top 20, unanswered): {dict(sorted(syllabus.items(), key=lambda x: -x[1])[:20])}")

# Check sources
sources = Counter(r.get('sourceFile','') for r in unanswered)
print(f"\nSource distribution (unanswered): {dict(sorted(sources.items(), key=lambda x: -x[1])[:20])}")
