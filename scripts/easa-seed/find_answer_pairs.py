import sys, os, glob
sys.stdout.reconfigure(encoding='utf-8')

base = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1'
files = os.listdir(base)

# Find pairs of WITH ANSWERS and WITHOUT ANSWERS
with_ans = [f for f in files if 'WITH ANSWERS' in f]
without_ans = [f for f in files if 'WITHOUT ANSWERS' in f]

print('WITH ANSWERS files:')
for f in sorted(with_ans):
    print(f'  {f}')

print('\nWITHOUT ANSWERS files:')
for f in sorted(without_ans):
    print(f'  {f}')

# Check specific pairs
pairs = []
for w in without_ans:
    base_name = w.replace('WITHOUT ANSWERS', '').replace('(1)', '').strip()
    for wa in with_ans:
        if base_name.replace('WITH ANSWERS', '').strip() in wa:
            pairs.append((w, wa))

print(f'\nFound {len(pairs)} potential pairs')
for w, wa in pairs:
    print(f'  WITHOUT: {w}')
    print(f'  WITH:    {wa}')
    print()
