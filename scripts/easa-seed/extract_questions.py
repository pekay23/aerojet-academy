"""Question extractor for .docx / .pdf / .html sources.

Output: scripts/easa-seed/out/<module_code>/<file_stem>.jsonl
Each line: {"raw": "...full question text including options...",
            "question": "...", "options": ["A. ...", "B. ...", ...],
            "correct": "A" | None, "answer_text": "..." | None,
            "category": "...", "source_file": "...",
            "source_module": "M1"}

Handles formats seen so far:
  - "1. The question text\n   a. option\n   b. option\n   c. option"
  - "1. Question?\n   A. opt\n   B. opt\n   C. opt\n   Answer: a"  (M3 PistonsQuestions)
  - "1. Question?\n1. opt\n2. opt\n3. opt\nCorrect"  (M10 with answers)
  - "1. Question?\n   - a) *Opt*\n   - b) *Opt*\n   - c) Opt"  (M2 team with *bold answers*)
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from dataclasses import dataclass, asdict
from pathlib import Path

from docx import Document
import pdfplumber
from bs4 import BeautifulSoup

OUT_DIR = Path(__file__).parent / "out"
AEROJET_ROOT = Path(
    r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation"
)


@dataclass
class Question:
    raw: str
    question: str
    options: list[str]
    correct: str | None  # "A" | "B" | "C" | "D" or None
    answer_text: str | None
    category: str | None
    source_file: str
    source_module: str
    fmt: str  # "docx" | "pdf" | "html" | "docx_xml"

    def is_valid(self) -> bool:
        return 10 < len(self.question) < 2000 and 2 <= len(self.options) <= 5


# ---------- DOCX / DOCX-XML readers ----------

def _read_docx_paragraphs(path: Path) -> list[str]:
    """Read paragraphs; fall back to direct XML read for macro-enabled files."""
    try:
        d = Document(str(path))
        return [p.text for p in d.paragraphs]
    except Exception:
        try:
            z = zipfile.ZipFile(str(path))
            xml = z.read("word/document.xml").decode("utf-8")
            return re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml)
        except Exception:
            return []


def _read_docx_table_rows(path: Path) -> list[list[str]]:
    try:
        d = Document(str(path))
    except Exception:
        return []
    rows = []
    for table in d.tables:
        for row in table.rows:
            rows.append([c.text.strip() for c in row.cells])
    return rows


# ---------- PDF reader ----------

def _read_pdf_pages(path: Path) -> list[str]:
    pages: list[str] = []
    try:
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                try:
                    pages.append(page.extract_text() or "")
                except Exception:
                    pages.append("")
    except Exception as exc:
        print(f"  pdf fail {path.name}: {exc}", file=sys.stderr)
    return pages


# ---------- HTML reader ----------

def _read_html_text(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "lxml")
    return soup.get_text(separator="\n", strip=True)


# ---------- Pattern parsers ----------

# Pattern A: "1. Question text\n   a. opt1\n   b. opt2\n   c. opt3"
RE_NUM_A = re.compile(r"^(\d+)\s*[\.\)]\s*(.+?)(?=\n\s*[a-dA-D][\.\)]\s)", re.MULTILINE | re.DOTALL)
RE_OPT_LETTER = re.compile(r"^\s*([a-dA-D])\s*[\.\)]\s*(.+?)(?=\n\s*[a-dA-D][\.\)]\s|\n\s*\d+[\.\)]\s|\Z)", re.MULTILINE | re.DOTALL)
# Pattern B: "1. Question?\n1. opt\n2. opt\n3. opt\nCorrect" (M10)
RE_NUM_B = re.compile(r"^(\d+)\s*[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]\s*\S)", re.MULTILINE | re.DOTALL)
RE_OPT_NUM = re.compile(r"^\s*(\d)\s*[\.\)]\s*(.+?)(?=\n\s*\d[\.\)]\s|\Z)", re.MULTILINE | re.DOTALL)
# Pattern C: Markdown-style "1. Q\n   - a) *opt*\n   - b) opt"
RE_OPT_MARK = re.compile(r"^\s*[-*]\s*([a-dA-D])\)\s*(.+?)(?=\n\s*[-*]\s*[a-dA-D]\)|\Z)", re.MULTILINE | re.DOTALL)
RE_ANSWER_LINE = re.compile(r"^\s*(?:Answer|Ans|Correct)\s*[:\-]?\s*([a-dA-D1-3])\b", re.MULTILINE | re.IGNORECASE)
RE_ANSWER_BARE = re.compile(r"^\s*(?:Correct|correct)\s*$", re.MULTILINE)


def _split_questions(paragraphs: list[str]) -> list[str]:
    """Given a list of paragraphs, return a list of question blocks.

    A block starts with a line that looks like '1. ...' or '1) ...' and
    continues until the next such line.
    """
    blocks: list[str] = []
    cur: list[str] = []
    in_q = False
    for line in paragraphs:
        s = line.strip()
        if re.match(r"^\d+\s*[\.\)]\s+\S", s):
            if cur:
                blocks.append("\n".join(cur).strip())
            cur = [line]
            in_q = True
        elif in_q:
            cur.append(line)
    if cur:
        blocks.append("\n".join(cur).strip())
    return [b for b in blocks if b]


def _parse_block_letter(block: str) -> tuple[str, list[str], int | None] | None:
    """Parse '1. Q\n   a. opt\n   b. opt\n   c. opt' style.

    Returns (question, [optA, optB, optC, ...], correct_index) or None.
    """
    lines = block.split("\n")
    first = lines[0]
    m = re.match(r"^\d+\s*[\.\)]\s*(.+)", first)
    if not m:
        return None
    q_text = m.group(1).strip()
    opts: list[str] = []
    correct_idx = None
    opt_re = re.compile(r"^\s*(?:#\s+)?([a-dA-D])\s*[\.\)]\s*(.+)$")
    for line in lines[1:]:
        m2 = opt_re.match(line)
        if m2:
            letter = m2.group(1).upper()
            text = m2.group(2).strip()
            opts.append(text)
            if line.strip().startswith("#"):
                correct_idx = ord(letter) - ord("A")
    if not opts:
        return None
    return q_text, opts, correct_idx


def _parse_block_number(block: str) -> tuple[str, list[str], int | None] | None:
    """Parse '1. Q\n1. opt\n2. opt\n3. opt' style (M10).
    
    Also handles multi-line options and stops at 'Correct'/'Incorrect' markers.
    """
    lines = block.split("\n")
    first = lines[0]
    m = re.match(r"^\d+\s*[\.\)]\s*(.+)", first)
    if not m:
        return None
    q_text = m.group(1).strip()
    opts: list[str] = []
    correct_idx = None
    opt_re = re.compile(r"^\s*(?:#\s+)?(\d)\s*[\.\)]\s*(.*)$")
    footer_re = re.compile(r"^(Correct|Incorrect|Category:|Answer:|Answers:|Key:)", re.IGNORECASE)
    
    i = 1
    current_idx = None
    current_text_parts = []
    
    while i < len(lines):
        line = lines[i]
        # Stop at footer lines
        if footer_re.match(line.strip()):
            if current_idx is not None:
                opts.append(" ".join(current_text_parts).strip())
            current_idx = None  # prevent double-save
            break
        m2 = opt_re.match(line)
        if m2:
            # Save previous option if exists
            if current_idx is not None:
                opts.append(" ".join(current_text_parts).strip())
            current_idx = int(m2.group(1)) - 1
            current_text_parts = [m2.group(2)] if m2.group(2) else []
            if line.strip().startswith("#"):
                correct_idx = current_idx
            i += 1
        elif current_idx is not None:
            # Continuation of current option text
            text = line.strip()
            if text and not re.match(r"^\d+\s*[\.\)]", text):
                current_text_parts.append(text)
            i += 1
        else:
            i += 1
    
    # Save last option
    if current_idx is not None:
        opts.append(" ".join(current_text_parts).strip())
    
    if not opts:
        return None
    return q_text, opts, correct_idx


def _parse_block_markdown(block: str) -> tuple[str, list[str]] | None:
    """Parse '1. Q\n   - a) *opt*' style (M2 teams)."""
    lines = block.split("\n")
    first = lines[0]
    m = re.match(r"^\d+\s*[\.\)]\s*(.+)", first)
    if not m:
        return None
    q_text = m.group(1).strip()
    opts: list[str] = []
    opt_re = re.compile(r"^\s*[-*]\s*([a-dA-D])\)\s*(.+)$")
    for line in lines[1:]:
        m2 = opt_re.match(line)
        if m2:
            opts.append(m2.group(2).strip())
    if not opts:
        return None
    return q_text, opts


def _find_answer(block: str, opts: list[str]) -> tuple[str | None, str | None]:
    """Find the answer marker. Returns (letter, full answer text) or (None, None)."""
    # Look for "Answer: a" or "Answer: 1" or "Correct" line
    m = RE_ANSWER_LINE.search(block)
    if m:
        letter = m.group(1).upper()
        if letter.isdigit():
            idx = int(letter) - 1
            if 0 <= idx < len(opts):
                return chr(ord("A") + idx), opts[idx]
        return letter, None
    if RE_ANSWER_BARE.search(block):
        return "?", None  # marked correct but no specific letter
    # Look for *bold* answer in markdown opts
    for i, opt in enumerate(opts):
        if opt.startswith("*") and opt.endswith("*") and len(opt) > 2:
            return chr(ord("A") + i), opt.strip("*")
        if "**" in opt:
            return chr(ord("A") + i), opt.replace("**", "").strip()
    return None, None


def _category_from_block(block: str) -> str | None:
    """A category heading precedes the question (a previous block's tail
    or a section header). Try the last non-empty line BEFORE the question
    number, but only if it looks like a heading.
    """
    # Inspect the block itself: a single non-question, non-option short
    # line at the very top can be a heading.
    lines = [l for l in block.split("\n") if l.strip()]
    if not lines:
        return None
    first = lines[0]
    if re.match(r"^\d+\s*[\.\)]", first):
        return None
    s = first.strip()
    if 3 < len(s) < 80 and not re.match(r"^[a-dA-D][\.\)]\s", s) and "?" not in s and "*" not in s:
        return s
    return None


def _parse_block_named(block: str) -> tuple[str, list[str], str | None] | None:
    """Parse 'Question Number. N. ... \\n Option A. ... \\n Option B. ... \\n Option C. ...' style.

    Returns (question, opts, explanation) or None.
    """
    lines = block.split("\n")
    # Find the question line
    q_text = None
    opts: list[str] = []
    expl: str | None = None
    opt_index: dict[str, str] = {}
    for line in lines:
        m = RE_Q_START_NAMED.match(line)
        if m and q_text is None:
            q_text = (m.group(2) or "").strip()
            if not q_text:
                # Question header line with no text on the same line
                continue
            else:
                continue
        m2 = RE_OPT_NAMED.match(line)
        if m2:
            letter = m2.group(1).upper()
            opt_index[letter] = m2.group(2).strip()
            continue
        m3 = RE_EXPL.match(line)
        if m3:
            expl = m3.group(1).strip()
            continue
    if q_text is None:
        return None
    # Assemble options in A, B, C, D order
    for letter in ("A", "B", "C", "D"):
        if letter in opt_index:
            opts.append(opt_index[letter])
    if not opts:
        return None
    return q_text, opts, expl


def _parse_block_bare(block: str) -> tuple[str, list[str], str | None, str | None] | None:
    """Parse 'Question?\nA) opt*\nB) opt\nC) opt' style. Returns
    (question, opts, category, answer_letter_with_star) or None.
    """
    lines = block.split("\n")
    # Find the first non-empty line ending in '?'
    q_text = None
    q_idx = -1
    for i, line in enumerate(lines):
        s = line.strip()
        if s.endswith("?") and len(s) > 15 and not re.match(r"^[A-Da-d][\.\)]\s", s):
            q_text = s
            q_idx = i
            break
    if q_text is None:
        return None
    # Collect A)/B)/C) options after the question
    opts: list[str] = []
    correct_idx: int | None = None
    for line in lines[q_idx + 1 :]:
        m = RE_OPT_PAREN.match(line.strip())
        if m:
            letter = m.group(1).upper()
            text = m.group(2).strip()
            # Detect trailing *
            if text.endswith("*"):
                text = text[:-1].strip()
                correct_idx = len(opts)
            opts.append(text)
        else:
            # Stop on first non-option line
            if opts:
                break
    if len(opts) < 2:
        return None
    correct_letter = chr(ord("A") + correct_idx) if correct_idx is not None else None
    # Category: look at lines BEFORE the question
    category = None
    for prev in lines[:q_idx]:
        s = prev.strip()
        if s and not re.match(r"^[A-Da-d][\.\)]\s", s):
            category = s
            break
    return q_text, opts, category, correct_letter


def _parse_blocks(blocks: list[str], source_file: str, module: str, fmt: str) -> list[Question]:
    questions: list[Question] = []
    for block in blocks:
        # Try named format first (Question Number. / Option A.)
        parsed = _parse_block_named(block)
        if parsed:
            q_text, opts, expl = parsed
            correct = None
            ans_text = None
            if expl:
                m = re.search(r"\b(?:answer|ans)\s*[:\-]?\s*([a-dA-D1-4])\b", expl, re.IGNORECASE)
                if m:
                    val = m.group(1).upper()
                    if val.isdigit():
                        idx = int(val) - 1
                        if 0 <= idx < len(opts):
                            correct = chr(ord("A") + idx)
                    else:
                        correct = val
            questions.append(
                Question(
                    raw=block.strip(),
                    question=q_text,
                    options=opts,
                    correct=correct,
                    answer_text=expl,
                    category=None,
                    source_file=source_file,
                    source_module=module,
                    fmt=fmt,
                )
            )
            continue
        # Try bare-question format (M7/M17 style)
        parsed = _parse_block_bare(block)
        if parsed:
            q_text, opts, category, correct = parsed
            questions.append(
                Question(
                    raw=block.strip(),
                    question=q_text,
                    options=opts,
                    correct=correct,
                    answer_text=None,
                    category=category,
                    source_file=source_file,
                    source_module=module,
                    fmt=fmt,
                )
            )
            continue
        # Then markdown / letter / number formats
        parsed = _parse_block_markdown(block)
        if not parsed:
            parsed = _parse_block_letter(block)
        if not parsed:
            parsed = _parse_block_number(block)
        if not parsed:
            continue
        q_text = opts = correct_idx = None
        if len(parsed) == 3:
            q_text, opts, correct_idx = parsed
        else:
            q_text, opts = parsed
        opts = [o.strip().strip("*").strip() for o in opts]
        correct = None
        ans_text = None
        if correct_idx is not None and 0 <= correct_idx < len(opts):
            correct = chr(ord("A") + correct_idx)
            ans_text = opts[correct_idx]
        else:
            correct, ans_text = _find_answer(block, opts)
        questions.append(
            Question(
                raw=block.strip(),
                question=q_text,
                options=opts,
                correct=correct,
                answer_text=ans_text,
                category=_category_from_block(block),
                source_file=source_file,
                source_module=module,
                fmt=fmt,
            )
        )
    return questions


# ---------- File-type dispatch ----------

# Question starters in various formats
RE_Q_START_BASIC = re.compile(r"^\s*(\d+)\s*[\.\)]\s*\S")  # "1. Q..."
RE_Q_START_NAMED = re.compile(r"^\s*Question\s+Number\.?\s*(\d+)\s*[\.\)]?\s*(.*)$", re.IGNORECASE)
RE_OPT_NAMED = re.compile(r"^\s*Option\s+([A-Da-d])\s*[\.\:]\s*(.+)$")
RE_OPT_PAREN = re.compile(r"^\s*([A-Da-d])\)\s*(.+?)\s*\*?\s*$")  # "A) opt" or "A) opt*"
RE_OPT_DOT_SPACE = re.compile(r"^\s*([A-Da-d])\s+([A-Z].+?)\s*\*?\s*$")  # "A opt"
RE_EXPL = re.compile(r"^\s*Expl\s*[\.\:]\s*(.+)$", re.IGNORECASE)
RE_Q_BARE = re.compile(r"^\s*([A-Z][^?]*\?)\s*$")  # bare question: ends with ?
RE_SECTION = re.compile(r"^\s*(Paragraph\s+\d+|Sub\s*\d+|Chapter\s+\d+|Section\s+\d+|\d+\s*[\.\)]\s*[A-Z][^?]{3,60}$)\s*$", re.IGNORECASE)


def _split_blocks_flexible(paragraphs: list[str]) -> list[str]:
    """Split a flat paragraph list into question blocks. Recognises:
      - '1. ...' basic
      - 'Question Number. N. ...'
      - bare question ending in '?' followed by A)/B)/C) options
    """
    blocks: list[str] = []
    cur: list[str] = []
    in_q = False

    def flush():
        nonlocal cur, in_q
        if cur:
            blocks.append("\n".join(cur).strip())
            cur = []
            in_q = False

    for line in paragraphs:
        s = line.rstrip()
        stripped = s.strip()
        if not stripped:
            if in_q and cur:
                flush()
            continue
        is_q_start = bool(
            RE_Q_START_BASIC.match(s) or RE_Q_START_NAMED.match(s) or RE_OPT_NAMED.match(s)
        )
        # Bare question = line ending in '?' (and not starting with A) etc)
        if not is_q_start and not in_q and stripped.endswith("?"):
            # If it looks like a real question
            if len(stripped) > 15 and not re.match(r"^[A-Da-d][\.\)]\s", stripped):
                flush()  # start fresh
                cur = [line]
                in_q = True
                continue
        # If we're in a question and the new line looks like a question
        # (a '?' line or a numbered question), end the current block.
        if in_q and (
            RE_Q_START_BASIC.match(s)
            or RE_Q_START_NAMED.match(s)
            or (stripped.endswith("?") and len(stripped) > 15)
        ):
            flush()
            cur = [line]
            in_q = True
            continue
        if is_q_start:
            flush()
            cur = [line]
            in_q = True
            continue
        if in_q:
            cur.append(line)
        else:
            # Pre-question lines could be a heading
            if RE_OPT_PAREN.match(s) or RE_OPT_NAMED.match(s):
                cur.append(line)
                in_q = True
    flush()
    return [b for b in blocks if b]

def extract_docx(path: Path, module: str) -> list[Question]:
    paras = _read_docx_paragraphs(path)
    if not paras:
        return []
    blocks = _split_blocks_flexible(paras)
    return _parse_blocks(blocks, path.name, module, "docx")


def extract_pdf(path: Path, module: str) -> list[Question]:
    pages = _read_pdf_pages(path)
    if not pages:
        return []
    paras: list[str] = []
    for page in pages:
        for line in page.split("\n"):
            paras.append(line)
    blocks = _split_blocks_flexible(paras)
    return _parse_blocks(blocks, path.name, module, "pdf")


def extract_html(path: Path, module: str) -> list[Question]:
    text = _read_html_text(path)
    if not text:
        return []
    paras = text.split("\n")
    blocks = _split_blocks_flexible(paras)
    return _parse_blocks(blocks, path.name, module, "html")


# ---------- Module discovery ----------

def module_from_path(path: Path) -> str:
    """Walk up to find a 'Module X' ancestor; default 'M2' for files inside M2."""
    p = path if path.is_dir() else path.parent
    for ancestor in [p, *p.parents]:
        if ancestor == AEROJET_ROOT or ancestor == ancestor.parent:
            break
        m = re.match(r"Module (\d+[A-Z]?)", ancestor.name)
        if m:
            return f"M{m.group(1)}"
    return "UNKNOWN"


def extract_file(path: Path) -> list[Question]:
    module = module_from_path(path)
    ext = path.suffix.lower()
    if ext == ".docx" or ext == ".doc":
        return extract_docx(path, module)
    if ext == ".pdf":
        return extract_pdf(path, module)
    if ext in (".html", ".htm"):
        return extract_html(path, module)
    return []


def write_questions(questions: list[Question], module: str, stem: str) -> Path:
    out_dir = OUT_DIR / module
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_stem = re.sub(r"[^A-Za-z0-9_.-]+", "_", stem)[:80]
    out_path = out_dir / f"{safe_stem}.jsonl"
    with out_path.open("w", encoding="utf-8") as f:
        for q in questions:
            f.write(json.dumps(asdict(q), ensure_ascii=False) + "\n")
    return out_path


def main() -> int:
    only_module = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else None
    only_type = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
    # Suntech training books contain textbook content, not question banks;
    # skip them.
    skip_substrings = (
        "-Training-book",
        "-B2-Training-book",
        "B1B2_",
        "_B1_",
        "_B2_",
        "AATA M",
        "M04-B2",
        "M4-B1_Electronic",
        "M4-B2_Electronic",
        "M5-B1",
        "M5-B2_Digital",
        "M05-B2",
        "M02-Training",
        "M01-Training",
        "M03-Training",
        "M11 - Turbine",
        "M11A - Turbine",
        "M13 — Aircraft",
        "M13 - Aircraft",
        "Module 14.pdf",
        "Module 14 notes",
        "Module 15",
        "M17-Training",
        "M6 Materials and Hardware",
        "M7 — Maintenance",
        "M7cmp1",
        "EASA Module 04",
        "EASA-MODULE-04",
        "EASA Module 08",
        "EASA MODULE 8",
        "EASA Module 11",
        "module 3 easa book",
        "M3(AATA)",
        "Cambridge International",
        "pdfcoffee.com_easa",
    )
    files = []
    for path in AEROJET_ROOT.rglob("*"):
        if not path.is_file():
            continue
        ext = path.suffix.lower()
        if ext not in (".docx", ".doc", ".pdf", ".html", ".htm"):
            continue
        if any(s in path.name for s in skip_substrings):
            continue
        if only_type == "docx" and ext not in (".docx", ".doc"):
            continue
        if only_type == "pdf" and ext != ".pdf":
            continue
        if only_type == "html" and ext not in (".html", ".htm"):
            continue
        if only_module and module_from_path(path) != only_module:
            continue
        files.append(path)
    print(f"Discovered {len(files)} files", flush=True)

    total = 0
    by_module: dict[str, int] = {}
    by_module_files: dict[str, int] = {}
    for path in files:
        qs = extract_file(path)
        qs = [q for q in qs if q.is_valid()]
        if not qs:
            continue
        module = module_from_path(path)
        write_questions(qs, module, path.stem)
        total += len(qs)
        by_module[module] = by_module.get(module, 0) + len(qs)
        by_module_files[module] = by_module_files.get(module, 0) + 1
        print(f"  [{module}] {path.name} -> {len(qs)} questions", flush=True)

    print(f"\nTotal: {total} questions across {len(by_module)} modules")
    for m in sorted(by_module):
        print(f"  {m}: {by_module[m]} questions from {by_module_files[m]} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
