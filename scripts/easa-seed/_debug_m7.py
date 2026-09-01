import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
from extract_questions import _read_docx_paragraphs, _split_blocks_flexible
from pathlib import Path
p = Path(r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 7 - Maintenance Practices\mcqs m7.docx")
paras = _read_docx_paragraphs(p)
blocks = _split_blocks_flexible(paras)
print(f"paras: {len(paras)}, blocks: {len(blocks)}")
for i, b in enumerate(blocks[:5]):
    print(f"=== block {i} ===")
    print(repr(b[:200]))
