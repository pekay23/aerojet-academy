#!/usr/bin/env python3
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import pdfplumber

pdf_path = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 1 - Mathematics\suntech\M01-Training-book.pdf'
with pdfplumber.open(pdf_path) as pdf:
    full_text = ''
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ''
        full_text += text + '\n'

searches = ['irrational', '77.95', 'Find the length of line BC', 'Which of the following']
for s in searches:
    if s in full_text:
        idx = full_text.index(s)
        print(f'Found "{s}" at pos {idx}:')
        print(full_text[max(0,idx-100):idx+300])
        print('---')
    else:
        print(f'NOT FOUND: {s}')
    print()

print(f'Total PDF chars: {len(full_text)}')
