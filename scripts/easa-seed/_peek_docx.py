"""Read docx paragraphs."""
import sys
from docx import Document

path = sys.argv[1]
d = Document(path)
n = 0
for p in d.paragraphs:
    if p.text.strip():
        sys.stdout.reconfigure(encoding="utf-8")
        print(p.text)
        n += 1
        if n >= int(sys.argv[2]) if len(sys.argv) > 2 else 200:
            break
