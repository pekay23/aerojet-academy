import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dirs = [
  'app/api/staff/admissions',
  'app/api/staff/admin',
  'app/api/staff/analytics',
  'app/api/staff/attendance',
  'app/api/staff/audit-logs',
  'app/api/staff/classrooms',
  'app/api/staff/course-categories',
  'app/api/staff/documents',
  'app/api/staff/email-preview',
  'app/api/staff/email-templates',
  'app/api/staff/email-test',
  'app/api/staff/export',
  'app/api/staff/finance',
  'app/api/staff/gdpr',
  'app/api/staff/instructors',
  'app/api/staff/license-categories',
  'app/api/staff/license-requirements',
  'app/api/staff/newsroom',
  'app/api/staff/ojt',
  'app/api/staff/payment-methods',
  'app/api/staff/payments',
  'app/api/staff/practical-training',
  'app/api/staff/programme-upgrades',
  'app/api/staff/programmes',
  'app/api/staff/reports',
  'app/api/staff/resit-backfill',
  'app/api/staff/semesters',
  'app/api/staff/settings',
  'app/api/staff/students',
  'app/api/staff/users',
  'app/api/staff/wallet-topups',
  'app/api/staff/welcome-messages',
  'app/api/staff/topbar-items',
  'app/api/admin',
  'app/api/analytics',
  'app/api/cron',
  'app/api/webhooks',
  'app/api/public',
  'app/api/images',
  'app/api/exchange-rates',
  'app/api/finance',
  'app/api/me',
  'app/api/search',
  'app/api/unsubscribe',
  'app/api/uploadthing',
]

const excludedPatterns = [
  'staff/payments/[id]/approve',
  'staff/payments/pending',
  'staff/finance/overview',
  'staff/finance/transactions',
  'staff/users/[id]',
  'staff/students/[id]',
  'gdpr/requests',
  'gdpr/requests/[id]',
  'referrals/payouts',
  'referrals/payouts/[id]',
  'referrals/bulk',
  'referrals/fraud-scan',
  'referrals/ambassador/[userId]/revoke',
  'public/submit-payment-proof',
  'public/register',
  'wallet-topups/[id]/approve',
  'gdpr-export',
  'anonymise',
  'activate',
  'suspend',
  'reset-password',
  'resend-verification',
  'resend-credentials',
  'restore',
  'toggle-password-change',
  'staff-analytics-dashboard',
]

const allRoutes: string[] = []

for (const dir of dirs) {
  const fullDir = path.join(__dirname, dir)
  if (!fs.existsSync(fullDir)) continue

  const files = fs.readdirSync(fullDir)
  for (const file of files) {
    if (file === 'route.ts') {
      const routePath = path.join(dir, file)
      const rel = routePath.replace(/^app\/api\//, '')
      const excluded = excludedPatterns.some(p => rel.includes(p))
      if (!excluded) {
        allRoutes.push(routePath)
      }
    } else if (fs.statSync(path.join(fullDir, file)).isDirectory()) {
      const subDir = path.join(dir, file)
      const subFiles = fs.readdirSync(subDir)
      for (const subFile of subFiles) {
        if (subFile === 'route.ts') {
          const routePath = path.join(subDir, subFile)
          const rel = routePath.replace(/^app\/api\//, '')
          const excluded = excludedPatterns.some(p => rel.includes(p))
          if (!excluded) {
            allRoutes.push(routePath)
          }
        } else if (fs.statSync(path.join(subDir, subFile)).isDirectory()) {
          const deepDir = path.join(subDir, subFile)
          const deepFiles = fs.readdirSync(deepDir)
          for (const deepFile of deepFiles) {
            if (deepFile === 'route.ts') {
              const routePath = path.join(deepDir, deepFile)
              const rel = routePath.replace(/^app\/api\//, '')
              const excluded = excludedPatterns.some(p => rel.includes(p))
              if (!excluded) {
                allRoutes.push(routePath)
              }
            }
          }
        }
      }
    }
  }
}

console.log(`Found ${allRoutes.length} routes to test`)
for (const r of allRoutes) {
  console.log(r)
}
