// Quick parse test
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { parse } from "csv-parse/sync"

const dir = path.join(process.cwd(), "scripts", "easa-seed", "csvs")
const file = process.argv[2] || "M1.csv"
const raw = readFileSync(path.join(dir, file), "utf-8")
const rows = parse(raw, { columns: true, skip_empty_lines: true })
console.log(`Parsed ${rows.length} rows from ${file}`)
const withAns = rows.filter((r: any) => r.correctAnswer).length
const withLO = rows.filter((r: any) => r.syllabusRef).length
console.log(`  ${withAns} with answers, ${withLO} with LO codes`)
console.log("First row:", rows[0])
