import sys
sys.stdout.reconfigure(encoding='utf-8')
import pymupdf
import re, os

one_drive = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals'

# Check the M3(AATA) highlighted.pdf for answers
aata_path = os.path.join(one_drive, 'M3(AATA) highlighted.pdf')
print(f"M3(AATA) highlighted.pdf size: {os.path.getsize(aata_path) / 1024 / 1024:.1f} MB")

doc = pymupdf.open(aata_path)
print(f"Pages: {doc.page_count}")

# Extract all text but also check for highlights
full_text = ''
highlights = []
for i in range(min(50, doc.page_count)):  # Sample first 50 pages
    page = doc.load_page(i)
    full_text += page.get_text()
    # Check for annotations/highlights
    annots = page.annots()
    if annots:
        for annot in annots:
            if annot.type[0] == 8:  # Highlight
                rect = annot.rect
                words = page.get_text("words", clip=rect)
                highlight_text = ' '.join(w[4] for w in words)
                if highlight_text.strip():
                    highlights.append((i, highlight_text.strip()[:100]))

print(f"\nFull text length (first 50 pages): {len(full_text)} chars")
print(f"Highlights found: {len(highlights)}")

# Search for answer patterns
ans_count = len(re.findall(r'[Aa]nswer', full_text))
print(f"'Answer' mentions: {ans_count}")

# Check if there are question-answer patterns
qna_patterns = len(re.findall(r'(?:what|which|how|when|why|where|if)\s+.*\?[^\n]*\n[a-c]\)', full_text, re.IGNORECASE))
print(f"Potential Q&A patterns: {qna_patterns}")

# Sample highlights
for page, text in highlights[:20]:
    print(f"  Page {page}: {text}")

doc.close()

# Also check the M3(AATA).pdf (non-highlighted) for answer patterns
aata2_path = os.path.join(one_drive, 'M3(AATA).pdf')
print(f"\nM3(AATA).pdf size: {os.path.getsize(aata2_path) / 1024 / 1024:.1f} MB")
doc2 = pymupdf.open(aata2_path)
print(f"Pages: {doc2.page_count}")

# Search text on first page for "answer" or "question"
for i in range(min(10, doc2.page_count)):
    page = doc2.load_page(i)
    text = page.get_text()
    if re.search(r'[Aa]nswer|sa[mp]+le\s*[Qq]uestion', text):
        print(f"\nPage {i}: Found answer/question patterns")
        for line in text.split('\n'):
            if re.search(r'[Aa]nswer|[Qq]uestion', line):
                print(f"  {line.strip()[:150]}")

# Check the full text of first few pages
full_text2 = ''
for i in range(min(20, doc2.page_count)):
    full_text2 += doc2.load_page(i).get_text()

ans_count2 = len(re.findall(r'[Aa]nswer', full_text2))
print(f"\nM3(AATA).pdf - 'Answer' mentions in first 20 pages: {ans_count2}")

doc2.close()
