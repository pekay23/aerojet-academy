import csv
from pathlib import Path

# Verify seed script will work correctly
path = Path(__file__).parent / "csvs_answered" / "M17.csv"
rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))

# Check that all rows have the required fields
required_fields = ["module", "text", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "difficulty", "status", "reviewNote"]

print(f"Total rows: {len(rows)}")
print(f"Has correctAnswer: {sum(1 for r in rows if r.get('correctAnswer', '').strip())}")
print(f"Has NEEDS_ANSWER: {sum(1 for r in rows if 'NEEDS_ANSWER' in r.get('reviewNote', ''))}")
print(f"Status values: {set(r.get('status', '') for r in rows)}")

# Check for any issues
issues = []
for i, row in enumerate(rows):
    for field in required_fields:
        if not row.get(field, '').strip():
            issues.append(f"Row {i}: missing {field}")

if issues:
    print(f"\nIssues found ({len(issues)}):")
    for issue in issues[:10]:
        print(f"  {issue}")
else:
    print("\nNo issues found - CSV is ready for seeding!")
