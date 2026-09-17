import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('doc-text/M1/M01-Training-book.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

keywords = ['example', 'exercise', 'problem', 'answer', 'solution', 'test', 'quiz', 'multiple choice']
matches = [(i+1, l.rstrip()) for i, l in enumerate(lines) if any(k in l.lower() for k in keywords)]
print(f'Found {len(matches)} matching lines')
for n, l in matches[:100]:
    print(f'{n}: {l}')
