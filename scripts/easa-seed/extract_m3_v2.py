import docx
import pdfplumber
import os
import re

one_drive = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals'
output_dir = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3'
os.makedirs(output_dir, exist_ok=True)

files_to_extract = [
    ('Revision/3.1.docx', 'Revision_3.1.txt'),
    ('Revision/3.2.docx', 'Revision_3.2.txt'),
    ('Revision/3.3.docx', 'Revision_3.3.txt'),
    ('Revision/3.4.docx', 'Revision_3.4.txt'),
    ('Revision/3.5.docx', 'Revision_3.5.txt'),
    ('Capacitors.docx', 'Capacitors.txt'),
    ('Team November Terminologies.docx', 'TeamNovember_Terminologies.txt'),
    ('Revision Sub Module 1&4&7.docx', 'Revision_SubModule.txt'),
    ('Group Charlie .docx', 'GroupCharlie.txt'),
    ('PistonsQuestions.docx', 'PistonsQuestions.txt'),
    ('Module 3 Quiz 3.pdf', 'Module3_Quiz3.txt'),
    ('Team November.pdf', 'TeamNovember_2.txt'),
    ('261722955-Module-3.pdf', '261722955-Module-3_v2.txt'),
    ('TRANSFORMER 4 (1)_230801_085906.pdf', 'TRANSFORMER_4.txt'),
    ('Team November Terminologies.pdf', 'TeamNovember_Terminologies_pdf.txt'),
]

for fname, out_name in files_to_extract:
    fpath = os.path.join(one_drive, fname)
    if not os.path.exists(fpath):
        print(f"NOT FOUND: {fpath}")
        continue
    
    try:
        if fname.endswith('.docx'):
            # Handle .docm files too (macro-enabled)
            doc = docx.Document(fpath)
            text = '\n'.join(p.text for p in doc.paragraphs if p.text.strip())
        elif fname.endswith('.pdf'):
            with pdfplumber.open(fpath) as pdf:
                text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
        
        out_path = os.path.join(output_dir, f'onedrive_{out_name}')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"OK: {fname} -> {len(text)} chars, {len(text.splitlines())} lines")
    except Exception as e:
        print(f"ERROR {fname}: {e}")
        # Try with pypdfium2
        try:
            import pypdfium2 as pdfium
            with pdfium.open_document(fpath) as doc:
                text = ''
                for page in doc:
                    text += page.get_text()
                out_path = os.path.join(output_dir, f'onedrive_{out_name}')
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(text)
                print(f"  FALLBACK OK: {len(text)} chars")
        except Exception as e2:
            print(f"  FALLBACK ERROR: {e2}")
