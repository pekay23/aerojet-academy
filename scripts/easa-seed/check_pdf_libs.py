import sys
print("Python:", sys.executable)
print("Version:", sys.version)

try:
    import PyPDF2
    print("PyPDF2: available")
except Exception as e:
    print("PyPDF2: not available -", e)

try:
    import pdfplumber
    print("pdfplumber: available")
except Exception as e:
    print("pdfplumber: not available -", e)

try:
    import fitz
    print("PyMuPDF (fitz): available")
except Exception as e:
    print("PyMuPDF: not available -", e)
