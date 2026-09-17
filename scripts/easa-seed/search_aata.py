import sys
sys.stdout.reconfigure(encoding='utf-8')
import pymupdf
import re, os

one_drive = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals'

# Search M3(AATA).pdf for "answer" patterns using fast text search
aata_path = os.path.join(one_drive, 'M3(AATA).pdf')
doc = pymupdf.open(aata_path)
print(f"Pages: {doc.page_count}")

# Search for "answer" across all pages using pymupdf's search_for
answer_pages = []
for i in range(doc.page_count):
    page = doc.load_page(i)
    instances = page.search_for("answer")
    if instances:
        answer_pages.append(i)
        if len(answer_pages) <= 50:
            # Get some context
            text = page.get_text()
            for line in text.split('\n'):
                if re.search(r'answer', line, re.IGNORECASE):
                    print(f"  Page {i}: {line.strip()[:150]}")

print(f"\nTotal pages with 'answer': {len(answer_pages)}")
if len(answer_pages) > 50:
    print(f"  (showing first 50)")
    for p in answer_pages[50:]:
        page = doc.load_page(p)
        text = page.get_text()
        for line in text.split('\n'):
            if re.search(r'answer', line, re.IGNORECASE):
                print(f"  Page {p}: {line.strip()[:150]}")

# Also search for "ANSWERS" (uppercase)
answers_pages = []
for i in range(doc.page_count):
    page = doc.load_page(i)
    instances = page.search_for("ANSWERS")
    if instances:
        answers_pages.append(i)

print(f"\nTotal pages with 'ANSWERS': {len(answers_pages)}")

doc.close()
