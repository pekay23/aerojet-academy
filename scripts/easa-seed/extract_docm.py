import zipfile
import re
import os

one_drive = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals'
output_dir = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3'

fpath = os.path.join(one_drive, 'PistonsQuestions.docx')
# .docm is same as .docx internally - it's a zip file
with zipfile.ZipFile(fpath, 'r') as z:
    word_files = [n for n in z.namelist() if n.startswith('word/') and n.endswith('.xml')]
    print(f"Word XML files: {word_files}")
    for wf in word_files[:1]:
        content = z.read(wf).decode('utf-8', errors='replace')
        # Strip XML tags
        text = re.sub(r'<[^>]+>', ' ', content)
        text = re.sub(r'&lt;', '<', text)
        text = re.sub(r'&gt;', '>', text)
        text = re.sub(r'&amp;', '&', text)
        text = re.sub(r'&nbsp;', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        print(f"Length: {len(text)}")
        print(text[:3000])
