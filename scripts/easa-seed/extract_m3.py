import docx
import pdfplumber
import json
import re
import os

one_drive_dir = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals'

# Files to process
files_to_process = [
    'Aviators Question1.docx',
    '3.1.docx',
    '3.2.docx',
    '3.3.docx',
    '3.4.docx',
    '3.5.docx',
    'Group Charlie .docx',
    'PistonsQuestions.docx',
    'Revision Sub Module 1&4&7.docx',
    'Team November.pdf',
    '261722955-Module-3.pdf',
    'TRANSFORMER 4 (1)_230801_085906.pdf',
]

doc_texts = {}

for fname in files_to_process:
    fpath = os.path.join(one_drive_dir, fname)
    if not os.path.exists(fpath):
        print(f"NOT FOUND: {fpath}")
        continue
    
    try:
        if fname.endswith('.docx'):
            doc = docx.Document(fpath)
            text = '\n'.join(p.text for p in doc.paragraphs if p.text.strip())
            doc_texts[fname] = text
            print(f"Extracted {fname}: {len(text)} chars, {len(text.splitlines())} lines")
        elif fname.endswith('.pdf'):
            with pdfplumber.open(fpath) as pdf:
                text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
            doc_texts[fname] = text
            print(f"Extracted {fname}: {len(text)} chars, {len(text.splitlines())} lines")
    except Exception as e:
        print(f"ERROR processing {fname}: {e}")

# Save extracted texts
output_dir = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3'
os.makedirs(output_dir, exist_ok=True)

for fname, text in doc_texts.items():
    out_name = fname.replace('.docx', '.txt').replace('.pdf', '.txt')
    out_path = os.path.join(output_dir, f'onedrive_{out_name}')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"  Saved: {out_path}")

# Now let's search for answer patterns in the extracted texts
print("\n=== Searching for answer patterns ===")
for fname, text in doc_texts.items():
    # Look for patterns like "Answer: A" or "answer: b" or "ANSWERS" etc.
    lines = text.split('\n')
    answer_lines = []
    for i, line in enumerate(lines):
        if re.search(r'answer|ANSWERS|key|solution|solutions', line, re.IGNORECASE):
            answer_lines.append((i, line.strip()))
    if answer_lines:
        print(f"\n--- {fname} - Answer-related lines: {len(answer_lines)} ---")
        for lineno, line in answer_lines[:30]:
            context_start = max(0, lineno - 2)
            context_end = min(len(lines), lineno + 3)
            print(f"  L{lineno}: {line[:100]}")
            for ctx_line in lines[context_start:context_end]:
                if ctx_line != line:
                    print(f"    ctx: {ctx_line.strip()[:100]}")
            if len(answer_lines) > 30:
                print(f"  ... ({len(answer_lines) - 30} more)")
