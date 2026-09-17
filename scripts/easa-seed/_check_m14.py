"""Check M14 PDF content extraction."""
import pypdf
r = pypdf.PdfReader(r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 14 - Propulsion\suntech\Module 14.pdf")
print("pages:", len(r.pages))
for i in [0, 5, 10, 50, 100, 200]:
    if i < len(r.pages):
        try:
            t = r.pages[i].extract_text()
            preview = (t or "")[:120]
            print(f"page {i}: {len(t or '')} chars; preview: {preview!r}")
        except Exception as e:
            print(f"page {i}: ERR {e}")
