"""Read M1 Questions.doc with both methods."""
import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
from doc_reader import read_doc
from docx import Document
import zipfile, re

p = r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 1 - Mathematics\Q Bank\Module 1 Questions.doc"

# Try docx
try:
    d = Document(p)
    print("== docx (Document) ==")
    for para in d.paragraphs:
        if para.text.strip():
            print(para.text)
except Exception as e:
    print("docx fail:", e)

# Try zipfile (macro-enabled docx)
try:
    z = zipfile.ZipFile(p)
    xml = z.read("word/document.xml").decode("utf-8")
    texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml)
    print("== docx (zipfile) ==")
    for t in texts[:30]:
        if t.strip():
            print(t)
except Exception as e:
    print("zipfile fail:", e)

# Try old .doc ASCII
print("== .doc ASCII ==")
print(read_doc(p)[:3000])
