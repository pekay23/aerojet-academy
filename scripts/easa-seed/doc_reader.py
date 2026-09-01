"""Read old .doc (Word 97-2003 binary) files via olefile + ASCII extraction.

Word stores text in compressed or uncompressed Unicode within the WordDocument
stream. For simple documents (which these team submissions are), the text
appears as readable ASCII runs when extracted naively.

We only read the WordDocument stream; the 1Table stream contains XML metadata
that pollutes the output.
"""
from __future__ import annotations

import re

import olefile


def read_doc(path: str) -> str:
    """Return concatenated readable text from a .doc file."""
    ole = olefile.OleFileIO(path)
    parts: list[str] = []
    # Only read WordDocument; skip 1Table (XML metadata)
    if ole.exists("WordDocument"):
        try:
            data = ole.openstream("WordDocument").read()
            runs = re.findall(rb"[\x20-\x7e]{3,}", data)
            parts.append(b"\n".join(runs).decode("ascii", errors="ignore"))
        except Exception:
            pass
    return "\n".join(parts)

