
import csv, random
CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

total = len(rows)
answered = sum(1 for r in rows if r.get('correctAnswer', '').strip())
needs = sum(1 for r in rows if r.get('status', '') == 'NEEDS_ANSWER')
high_conf = sum(1 for r in rows if r.get('aiConfidence', '') == 'HIGH')
med_conf = sum(1 for r in rows if r.get('aiConfidence', '') == 'MEDIUM')
low_conf = sum(1 for r in rows if r.get('aiConfidence', '') == 'LOW')

print(f'Total questions: {total}')
print(f'Answered (has correctAnswer): {answered}')
print(f'NEEDS_ANSWER status: {needs}')
print(f'HIGH confidence: {high_conf}')
print(f'MEDIUM confidence: {med_conf}')
print(f'LOW confidence: {low_conf}')

# Check a few random answered questions
random.seed(42)
sample = random.sample([r for r in rows if r.get('correctAnswer', '').strip()], 10)
print('\nSample answered questions:')
for r in sample:
    print(f"  [{r.get('syllabusRef', '')}] {r['text'][:60]} -> {r['correctAnswer']} ({r.get('aiConfidence', '')})")
