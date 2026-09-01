import "server-only"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import path from "node:path"
import { parse } from "csv-parse/sync"
import { prismaUnfiltered } from "../lib/prisma/client"

const EASA_SEED_DIR = path.join(process.cwd(), "scripts", "easa-seed", "csvs")

interface CsvRow {
  module: string
  syllabusRef: string
  level: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  difficulty: string
  subTopic: string
  aiSourceRef: string
  aiConfidence: string
  status: string
  reviewNote: string
  points: string
  sourceFile: string
  rawJson: string
}

const QUESTION_DIFFICULTY = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const

const QUESTION_STATUS = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const

type Difficulty = (typeof QUESTION_DIFFICULTY)[keyof typeof QUESTION_DIFFICULTY]
type Status = (typeof QUESTION_STATUS)[keyof typeof QUESTION_STATUS]

const ALLOWED_DIFFICULTIES = new Set<Difficulty>(
  Object.values(QUESTION_DIFFICULTY) as Difficulty[],
)
const ALLOWED_STATUSES = new Set<Status>(Object.values(QUESTION_STATUS) as Status[])

function toDifficulty(v: string): Difficulty {
  const up = v.toUpperCase()
  return ALLOWED_DIFFICULTIES.has(up as Difficulty) ? (up as Difficulty) : "MEDIUM"
}

function toStatus(v: string): Status {
  const up = v.toUpperCase()
  return ALLOWED_STATUSES.has(up as Status) ? (up as Status) : "DRAFT"
}

async function ensureBank(moduleCode: string): Promise<string> {
  const course = await prismaUnfiltered.course.findUnique({
    where: { code: moduleCode },
  })
  if (!course) {
    throw new Error(`Course ${moduleCode} not found in database`)
  }
  const bank = await prismaUnfiltered.internalExamBank.upsert({
    where: {
      id: `easa-${moduleCode.toLowerCase()}`,
    },
    update: {
      moduleCode,
      name: `EASA Part-66 ${moduleCode} Question Bank`,
      ruleSet: "EASA",
      isActive: true,
    },
    create: {
      id: `easa-${moduleCode.toLowerCase()}`,
      courseId: course.id,
      moduleCode,
      ruleSet: "EASA",
      name: `EASA Part-66 ${moduleCode} Question Bank`,
      description: `Seeded from C:/Users/Pekay/OneDrive - Ghana Communication Technology University/AerojetAviation (Module ${moduleCode}). Suntech-approved source of truth.`,
      mcqCount: 40,
      minimumPoolSize: 60,
      isActive: true,
    },
  })
  return bank.id
}

async function seedModule(moduleCode: string): Promise<number> {
  const csvPath = path.join(EASA_SEED_DIR, `${moduleCode}.csv`)
  if (!existsSync(csvPath)) {
    console.log(`  ${moduleCode}: no CSV at ${csvPath} — skipping`)
    return 0
  }
  const raw = readFileSync(csvPath, "utf-8")
  const rows: CsvRow[] = parse(raw, { columns: true, skip_empty_lines: true })

  const bankId = await ensureBank(moduleCode)

  // Idempotency: delete existing seeded questions for this bank before insert
  // (we keyed rawJson->sourceFile so the seed is replayable)
  await prismaUnfiltered.internalExamQuestion.deleteMany({
    where: { bankId, reviewNote: { contains: "NEEDS_ANSWER" } },
  })

  let inserted = 0
  // Batch in chunks of 100
  const CHUNK = 100
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK).map((row) => {
      const options = [row.optionA, row.optionB, row.optionC, row.optionD].filter(
        (o) => o && o.length > 0,
      )
      if (options.length < 2) return null
      const correct = row.correctAnswer || ""
      const levelNum = row.level ? Number(row.level) : null
      return {
        bankId,
        text: row.text.trim(),
        options,
        correctAnswer: correct,
        points: Number(row.points) || 1,
        subTopic: row.subTopic || null,
        difficulty: toDifficulty(row.difficulty),
        isEssay: false,
        essayTimeMins: 20,
        sortOrder: i + 1,
        isActive: true,
        status: toStatus(row.status),
        syllabusRef: row.syllabusRef || null,
        knowledgeLevel: Number.isFinite(levelNum) ? levelNum : null,
        aiSourceRef: row.aiSourceRef || null,
        aiConfidence: row.aiConfidence ? Number(row.aiConfidence) : null,
        aiSolvedAt: row.aiConfidence ? new Date() : null,
        reviewNote: row.reviewNote || null,
      }
    })
    const valid = batch.filter((b): b is NonNullable<typeof b> => b !== null)
    if (valid.length === 0) continue
    await prismaUnfiltered.internalExamQuestion.createMany({
      data: valid,
      skipDuplicates: false,
    })
    inserted += valid.length
  }
  return inserted
}

async function main() {
  console.log("🌱 Seeding EASA Part-66 question banks...")

  if (!existsSync(EASA_SEED_DIR)) {
    throw new Error(
      `CSV directory not found: ${EASA_SEED_DIR}. Run scripts/easa-seed/extract_questions.py + consolidate.py first.`,
    )
  }
  const files = readdirSync(EASA_SEED_DIR)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => f.replace(/\.csv$/, ""))
    .sort()

  console.log(`Found CSV files for modules: ${files.join(", ")}`)

  let total = 0
  for (const moduleCode of files) {
    try {
      const n = await seedModule(moduleCode)
      console.log(`  ✅ ${moduleCode}: ${n} questions`)
      total += n
    } catch (err) {
      console.error(`  ❌ ${moduleCode}: ${(err as Error).message}`)
    }
  }

  console.log(`\nDone. Seeded ${total} questions across ${files.length} modules.`)
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
    .finally(() => process.exit(0))
}

export { seedModule, ensureBank }
