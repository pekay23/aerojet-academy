# EASA Part-66 Question Bank Pipeline

End-to-end pipeline that converts your `~/OneDrive/AerojetAviation` folder
into CSV files and a Prisma seed for the EASA Part-66 question banks.

## Files

| File | Purpose |
| --- | --- |
| `sources.py` | Source-of-truth PDF map (Suntech-approved training books only). M8/M9/M10 excluded (awaiting approved docs). |
| `doc_reader.py` | Reads old `.doc` (Word 97-2003 binary) via olefile ASCII extraction. |
| `extract_corpus.py` | Extracts paged text from each source-of-truth PDF → `corpus/<module>.jsonl`. |
| `extract_questions.py` | Extracts questions from `.docx`/`.doc`/`.pdf`/`.html` files into `out/<module>/*.jsonl`. Handles 5+ question formats (`1. Q` lettered, `Question Number. N`, `1) Q` numbered, bare `?` question, markdown `*` answers). |
| `build_lo_catalog.py` | Extracts the EASA Part-66 LO catalog from the Suntech training book TOCs → `lo_catalog.json`. |
| `consolidate.py` | Loads every `out/<module>/*.jsonl`, exact-dedups, semhash semantic-dedups, tags LO codes, writes `csvs/<module>.csv`. |
| `seed-easa-questions.ts` (in `prisma/`) | Prisma seed that creates one `InternalExamBank` per module (`EASA Part-66 Mx`) and inserts every CSV row. |

## Run order (Python)

From `scripts/easa-seed/`:

```bash
.venv\Scripts\python.exe extract_corpus.py        # builds corpus/*.jsonl
.venv\Scripts\python.exe build_lo_catalog.py      # builds lo_catalog.json
.venv\Scripts\python.exe extract_questions.py M1 docx
.venv\Scripts\python.exe extract_questions.py M1 pdf
# ... repeat for each module
.venv\Scripts\python.exe consolidate.py           # builds csvs/*.csv
```

Or extract all modules in one sweep:

```bash
.venv\Scripts\python.exe extract_questions.py M1 docx
.venv\Scripts\python.exe extract_questions.py M2 docx
.venv\Scripts\python.exe extract_questions.py M3 docx
.venv\Scripts\python.exe extract_questions.py M4 docx
.venv\Scripts\python.exe extract_questions.py M5 docx
.venv\Scripts\python.exe extract_questions.py M6 docx
.venv\Scripts\python.exe extract_questions.py M7 docx
.venv\Scripts\python.exe extract_questions.py M11A docx
.venv\Scripts\python.exe extract_questions.py M13 docx
.venv\Scripts\python.exe extract_questions.py M14 docx
.venv\Scripts\python.exe extract_questions.py M15 docx
.venv\Scripts\python.exe extract_questions.py M17 docx
.venv\Scripts\python.exe extract_questions.py M1 pdf
# ... and again for each module
.venv\Scripts\python.exe consolidate.py
```

## Seed to database

```bash
bun run db:seed:easa
```

Creates one `InternalExamBank` (`easa-m1`, `easa-m2`, ...) per CSV. Each row
becomes an `InternalExamQuestion` with:
- `text` / `options` / `correctAnswer`
- `syllabusRef` = `Mx.y.z(l)` (EASA LO code) or empty if not tagged
- `knowledgeLevel` = 1 / 2 / 3 from the source book
- `difficulty` = `EASY` / `MEDIUM` / `HARD` (heuristic by text length + option count)
- `status` = `APPROVED` if the source had a correct answer, else `DRAFT` with `reviewNote="NEEDS_ANSWER — answer not provided in source; solve via Suntech corpus or admin review"`
- `aiSourceRef` / `aiConfidence` — populated by the (not-yet-built) answer solver

Re-runs are idempotent: questions whose `reviewNote` starts with `NEEDS_ANSWER`
are deleted before re-insert.

## Status (current run)

```
M1:  454 unique questions (0 with answers)
M2:  535 unique questions
M3: 1019 unique questions
M4:  191 unique questions
M5:  635 unique questions
M6:  245 unique questions
M7:   97 unique questions (97 with answers)
M11A: 371 unique questions
M13:  520 unique questions
M17:  63 unique questions
TOTAL: 4130 unique questions across 10 modules
```

## M14 / M8 / M9 / M10

- **M14**: only file is an encrypted image-scan PDF; needs OCR or replacement
  with a text PDF.
- **M8 / M9 / M10**: intentionally excluded — awaiting Suntech-approved
  source-of-truth training books. Re-run once provided.

## Next: AI answer solver

The remaining ~3500 questions lack source-of-truth answers. The plan is to
spawn Kilo subagent tasks that:

1. Receive a batch of ~10 questions + the relevant Suntech corpus page
   snippets (top-k by embedding similarity).
2. Reason over the snippets only (no general knowledge, no web search).
3. Return `{ correctAnswer, confidence, sourceRef: "corpus:M3#p42" }`.

The subagent outputs feed back into the `consolidate.py` step and re-write
the CSVs with `aiSourceRef` / `aiConfidence` populated. Re-running
`db:seed:easa` then updates the bank.
