"""Look at M2 THERMO 1 docx structure."""
import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
from extract_questions import _read_docx_paragraphs
from pathlib import Path
p = Path(r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 2 - Physics\Questions\AEROJET LEARNING THRU QUESTIONS THERMODYNAMICS 1.docx")
for line in _read_docx_paragraphs(p):
    print(repr(line))
