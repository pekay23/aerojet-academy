const fs = require('fs')
const path = require('path')
try {
  const envPath = path.resolve('.env')
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    txt.split('\n').forEach((l) => {
      const i = l.indexOf('=')
      if (i > 0) {
        const k = l.slice(0, i).trim()
        let v = l.slice(i + 1).trim().replace(/^["']|["']$/g, '')
        if (k && !process.env[k]) process.env[k] = v
      }
    })
  }
} catch (e) {}

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaNeon } = require('@prisma/adapter-neon')
const { Pool } = require('pg')
const url = process.env.DATABASE_URL
const adapter = url.includes('.neon.tech')
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg(new Pool({ connectionString: url }))
const p = new PrismaClient({ adapter })

p.generalResource
  .findMany({
    select: {
      id: true,
      name: true,
      category: true,
      showToInstructors: true,
      courses: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  .then((r) => {
    r.forEach((x) => {
      console.log(
        x.category.padEnd(14),
        '| ins=' + x.showToInstructors,
        '|',
        x.name,
        '| courses=[' + x.courses.map((c) => c.code).join(',') + ']'
      )
    })
    return p.$disconnect()
  })
  .catch((e) => {
    console.error('ERR', e.message)
    process.exit(1)
  })
