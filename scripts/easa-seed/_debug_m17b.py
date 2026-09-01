import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
from extract_questions import _read_docx_paragraphs, _split_blocks_flexible
from pathlib import Path
p = Path(r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 17 - Propellers\M17 - Propeller standard test.docx")
paras = _read_docx_paragraphs(p)
blocks = _split_blocks_flexible(paras)
for b in blocks[:3]:
    print('===')
    print(b)
    print()
