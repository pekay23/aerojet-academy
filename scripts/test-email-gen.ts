import { generateAcademyEmail } from '../lib/auth/helpers'

console.log('Testing Academy Email Generation:')

const tests = [
  { f: 'John', m: '', l: 'Doe', expected: 'j.doe@aerojet-academy.com' },
  { f: 'John', m: 'Quincy', l: 'Adams', expected: 'j.q.adams@aerojet-academy.com' },
  { f: 'John Paul', m: 'Quincy', l: 'Adams', expected: 'j.p.q.adams@aerojet-academy.com' },
  { f: 'J.', m: 'Q.', l: 'Adams', expected: 'j.q.adams@aerojet-academy.com' },
  { f: 'John', m: 'M. Q.', l: 'Public', expected: 'j.m.q.public@aerojet-academy.com' },
  { f: 'Alice', m: 'Marie Louise', l: 'Smith', expected: 'a.m.l.smith@aerojet-academy.com' },
]

async function run() {
  for (const { f, m, l, expected } of tests) {
    const result = await generateAcademyEmail(f, m, l)
    const status = result === expected ? '✅ PASS' : `❌ FAIL (Expected ${expected}, got ${result})`
    console.log(`${f} | ${m} | ${l} => ${result} [${status}]`)
  }
}

run().catch(console.error)
