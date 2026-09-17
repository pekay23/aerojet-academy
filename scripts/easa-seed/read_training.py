import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('doc-text/M1/M01-Training-book.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')
for i, line in enumerate(lines[:300]):
    print(f'{i+1}: {line.rstrip()}')
