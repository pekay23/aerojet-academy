import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

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
  'webhooks/resend',
  'webhooks/stripe',
  'webhooks/uploadthing',
]

function getRouteFiles(dir) {
  const fullDir = path.join(root, dir)
  if (!fs.existsSync(fullDir)) return []
  const files = []
  for (const entry of fs.readdirSync(fullDir)) {
    const fullPath = path.join(fullDir, entry)
    const stat = fs.statSync(fullPath)
    if (entry === 'route.ts' && stat.isFile()) {
      const rel = dir + '/' + entry
      const excluded = excludedPatterns.some(p => rel.includes(p))
      if (!excluded) files.push(rel)
    } else if (stat.isDirectory()) {
      files.push(...getRouteFiles(dir + '/' + entry))
    }
  }
  return files
}

function detectMethods(content) {
  const methods = []
  const patterns = [
    /\bexport\s+(?:const|async\s+function)\s+(GET|POST|PATCH|PUT|DELETE)\s*(?:=||\()/g,
    /\bexport\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(/g,
    /\bexport\s+const\s+(GET|POST|PATCH|PUT|DELETE)\s*=/g,
  ]
  for (const pattern of patterns) {
    for (const m of content.matchAll(pattern)) {
      if (!methods.includes(m[1])) methods.push(m[1])
    }
  }
  return methods
}

function detect404Pattern(content) {
  return content.includes('apiNotFound')
    || /apiError\(.*404/.test(content)
    || /not found.*404/i.test(content)
    || /NextResponse\.json.*status.*404/.test(content)
    || /return.*404/.test(content)
}

function getSchemaDefaults(content) {
  const defaults = {}
  const schemaMatch = content.match(/z\.object\(\s*\{([\s\S]*?)\}\s*\)/)
  if (!schemaMatch) return defaults
  const body = schemaMatch[1]
  const fieldRegex = /(\w+)\s*:\s*z\.(\w+)\s*\(/g
  let match
  while ((match = fieldRegex.exec(body)) !== null) {
    const name = match[1]
    const type = match[2]
    switch (type) {
      case 'string':
        defaults[name] = name.includes('email') ? 'test@example.com' : 'test'
        break
      case 'number':
        defaults[name] = 1
        break
      case 'boolean':
        defaults[name] = true
        break
      case 'array': {
        const afterArray = body.slice(match.index + match[0].length).trimStart()
        if (afterArray.startsWith('z.object')) {
          defaults[name] = [{ id: 'test' }]
        } else {
          defaults[name] = ['val1', 'val2', 'val3']
        }
        break
      }
      case 'enum': {
        const enumMatch = body.slice(match.index).match(/z\.enum\(\s*\[([^\]]*)\]/)
        if (enumMatch) {
          const vals = enumMatch[1].match(/'([^']+)'/g) || []
          defaults[name] = vals[0]?.replace(/'/g, '') || 'YES'
        }
        break
      }
      case 'object':
        defaults[name] = { id: 'test' }
        break
    }
  }
  return defaults
}

function getValidBody(content) {
  const defaults = getSchemaDefaults(content)
  if (Object.keys(defaults).length > 0) {
    return JSON.stringify(defaults)
  }
  return '{}'
}

function getModelName(relPath) {
  const parts = relPath.split('/')
  const lastPart = parts[parts.length - 1].replace(/[\[\]]/g, '')
  const modelMap = {
    'shortlist': 'application', 'score': 'application', 'permissions': 'permission',
    'grants': 'roleGrant', 'dashboard': 'user', 'features': 'user', 'forecast': 'user',
    'funnels': 'user', 'journey': 'user', 'pageviews': 'user', 'pipeline': 'application',
    'retention': 'user', 'trends': 'user', 'attendance': 'attendanceRecord',
    'summary': 'attendanceRecord', 'audit-logs': 'auditLog', 'classrooms': 'classroom',
    'layout': 'classroom', 'course-categories': 'courseCategory', 'documents': 'studentDocument',
    'expiring': 'studentDocument', 'email-preview': 'emailTemplate', 'email-templates': 'emailTemplate',
    'email-test': 'emailTemplate', 'export': 'user', 'reconcile': 'payment', 'reports': 'payment',
    'instructors': 'instructorProfile', 'qualifications': 'instructorQualification',
    'recency': 'instructorRecency', 'license-categories': 'licenseCategory',
    'license-requirements': 'licenseRequirement', 'newsroom': 'newsArticle', 'ojt': 'ojtLogbook',
    'entries': 'ojtEntry', 'competency': 'ojtEntry', 'sign': 'ojtEntry', 'verify': 'ojtEntry',
    'mentors': 'mentorAssignment', 'payment-methods': 'paymentMethod', 'toggle': 'paymentMethod',
    'payments': 'payment', 'uploads': 'fileUpload', 'practical-training': 'practicalTraining',
    'programme-upgrades': 'programmeUpgrade', 'programmes': 'fullTimeProgramme',
    'years': 'programmeYear', 'enrollment': 'enrollment', 'pools': 'examPool',
    'revenue': 'payment', 'roster': 'examPool', 'resit-backfill': 'examResult',
    'semesters': 'semester', 'settings': 'systemSetting', 'custom-fields': 'customField',
    'email-deliveries': 'emailDelivery', 'email-registry': 'emailTemplate', 'passkeys': 'passkey',
    'retention': 'retentionPolicy', 'students': 'user', 'import': 'user',
    'academic-period': 'academicTerm', 'book-exam': 'examBooking', 'exam-record': 'examResult',
    'notes': 'adminNote', 'study-pathway': 'studyPathwayModel', 'wallet': 'wallet',
    'proof': 'walletTransaction', 'wallet-transactions': 'walletTransaction', 'users': 'user',
    'counts': 'user', 'create': 'user', 'search': 'user', 'role': 'user', 'preview': 'user',
    'enrollment-status': 'enrollment', 'wallet-topups': 'payment', 'pending': 'payment',
    'welcome-messages': 'welcomeMessage', 'topbar-items': 'topbarItem', 'backup': 'backup',
    'schedule': 'backup', 'bulk-send-credentials': 'user', 'exams': 'examEvent',
    'mark-no-show': 'examBooking', 'track': 'analyticsEvent', 'aptitude-reminders': 'examEvent',
    'check-events': 'examEvent', 'check-pools': 'examPool', 'cleanup-abandoned-accounts': 'user',
    'cleanup-audit-logs': 'auditLog', 'expire-bundles': 'examBundle',
    'gdpr-retention': 'dataSubjectRequest', 'interview-reminders': 'examEvent',
    'milestone-reminders': 'examEvent', 'modular-deadlines': 'modularEnrollment',
    'payment-deadlines': 'payment', 'renewal-reminders': 'enrollment',
    'scheduled-reports': 'report', 'send-reminders': 'examEvent', 'supabase-mirror': 'fileUpload',
    'sync-check': 'fileUpload', 'resend': 'emailDelivery', 'stripe': 'payment',
    'uploadthing': 'fileUpload', 'contact': 'contactMessage', 'courses': 'course',
    'name': 'course', 'proxy': 'fileUpload', 'transform': 'fileUpload',
    'exchange-rates': 'exchangeRate', 'rates': 'exchangeRate', 'heartbeat': 'user',
    'privacy': 'user', 'study-pathway': 'studyPathwayModel', 'search': 'search', 'unsubscribe': 'user',
  }
  if (modelMap[lastPart]) return modelMap[lastPart]
  if (parts.length >= 2) {
    const secondLast = parts[parts.length - 2].replace(/[\[\]]/g, '')
    const key = secondLast + '-' + lastPart
    if (modelMap[key]) return modelMap[key]
  }
  return 'user'
}

function getTestFileName(relPath) {
  const parts = relPath.split('/')
  const filtered = parts.map(p => p.replace(/[\[\]]/g, '')).filter(p => p !== 'route.ts')
  return filtered.join('-') + '.test.ts'
}

function generateTest(routePath, content) {
  const methods = detectMethods(content)
  if (methods.length === 0) return ''

  const relPath = routePath.replace(/^app\/api\//, '').replace(/\/route\.ts$/, '')
  const routeUrl = '/api/' + relPath.replace(/\[([^\]]+)\]/g, ':$1')
  const paramNames = (relPath.match(/\[([^\]]+)\]/g) || []).map(m => m.replace(/[\[\]]/g, ''))
  const paramsObj = paramNames.map(p => `${p}: '1'`).join(', ')
  const paramsObj = paramNames.map(p => `${p}: '1'`).join(', ')
  const testFileName = getTestFileName(relPath)
  const testFilePath = path.join(root, 'tests', 'integration', 'api', testFileName)

  const usesUnfiltered = content.includes('prismaUnfiltered')
  const prismaModel = (model) => `prismaMock.${model}`

  let testContent = `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'\n`
  testContent += `import { prismaMock } from '@/tests/setup'\n`
  testContent += `import { NextRequest } from 'next/server'\n\n`

  if (content.includes('/auth/helpers') || content.includes('/auth/auth-options')) {
    testContent += `vi.mock('@/lib/auth/helpers', () => ({\n`
    testContent += `  getAuthSession: vi.fn(),\n`
    testContent += `  requireStaff: vi.fn(),\n`
    testContent += `  requireAdmin: vi.fn(),\n`
    testContent += `  requireAuth: vi.fn(),\n`
    testContent += `  hashPassword: vi.fn(),\n`
    testContent += `  generateToken: vi.fn(),\n`
    testContent += `  generateTempPassword: vi.fn(),\n`
    testContent += `  generateAcademyEmail: vi.fn(),\n`
    testContent += `  getClientIp: vi.fn(),\n`
    testContent += `  verifyPassword: vi.fn(),\n`
    testContent += `  generateStudentId: vi.fn(),\n`
    testContent += `  checkRateLimit: vi.fn(),\n`
    testContent += `  requireStudent: vi.fn(),\n`
    testContent += `  requireInstructor: vi.fn(),\n`
    testContent += `  requireApplicant: vi.fn(),\n`
    testContent += `  requireAdminOrStaff: vi.fn(),\n`
    testContent += `  requireExaminer: vi.fn(),\n`
    testContent += `  generateRegistrationCode: vi.fn(),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('/auth/permissions')) {
    testContent += `vi.mock('@/lib/auth/permissions', () => ({\n`
    testContent += `  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),\n`
    testContent += `  PERMISSIONS: {},\n`
    testContent += `}))\n\n`
  }

  if (content.includes('/audit/logger')) {
    testContent += `vi.mock('@/lib/audit/logger', () => ({\n`
    testContent += `  createAuditLog: vi.fn(),\n`
    testContent += `  AuditAction: {},\n`
    testContent += `  queryAuditLogs: vi.fn(),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('/email/')) {
    testContent += `vi.mock('@/lib/email/service', () => ({\n`
    testContent += `  sendEmail: vi.fn().mockResolvedValue(undefined),\n`
    testContent += `  sendBulkEmails: vi.fn().mockResolvedValue(undefined),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('next/cache')) {
    testContent += `vi.mock('next/cache', () => ({\n`
    testContent += `  unstable_cache: vi.fn((fn) => fn),\n`
    testContent += `  revalidateTag: vi.fn(),\n`
    testContent += `  revalidatePath: vi.fn(),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('/storage/')) {
    testContent += `vi.mock('@/lib/storage/supabase-storage', () => ({\n`
    testContent += `  uploadToStorage: vi.fn().mockResolvedValue('https://test.com/file'),\n`
    testContent += `  getSignedUrl: vi.fn().mockResolvedValue('https://test.com/file'),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('isInternalExamSystemEnabled') || content.includes('/internal-exam/engine')) {
    testContent += `vi.mock('@/lib/internal-exam/engine', () => ({\n`
    testContent += `  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('formatCurrency') || content.includes('@/lib/currency')) {
    testContent += `vi.mock('@/lib/currency', () => ({\n`
    testContent += `  formatCurrency: vi.fn((amount: number | string) => '€' + amount),\n`
    testContent += `  getCurrencySymbol: vi.fn(() => '€'),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('isInternalExamSystemEnabled') || content.includes('/internal-exam/engine')) {
    testContent += `vi.mock('@/lib/internal-exam/engine', () => ({\n`
    testContent += `  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),\n`
    testContent += `}))\n\n`
  }

  if (content.includes('formatCurrency') || content.includes('@/lib/currency')) {
    testContent += `vi.mock('@/lib/currency', () => ({\n`
    testContent += `  formatCurrency: vi.fn((amount: number | string) => '€' + amount),\n`
    testContent += `  getCurrencySymbol: vi.fn(() => '€'),\n`
    testContent += `}))\n\n`
  }

  const libImports = [...content.matchAll(/import\s+\{([^}]+)\}\s+from\s+'@\/lib\/([^']+)'/g)]
    .map(m => ({ names: m[1].split(',').map(n => n.trim().replace(/^type\s+/, '')).filter(Boolean), module: m[2] }))
    .filter(({ module }) => !['auth/helpers', 'auth/permissions', 'audit/logger', 'email/service', 'storage/supabase-storage', 'internal-exam/engine', 'security/rate-limit', 'currency', 'utils/string', 'utils/serialization', 'prisma/client', 'prisma/db-base', 'auth/auth-options'].includes(module))
  for (const { names, module } of libImports) {
    const mockEntries = names.map(n => {
      if (n === 'withErrorHandler') {
        return `  ${n}: vi.fn((fn: any) => {\n    return async (req: any, ctx?: any) => {\n      try {\n        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx\n        return await fn(req, resolvedCtx)\n      } catch (err) {\n        const message = err instanceof Error ? err.message : String(err)\n        if (message === 'Unauthorized') return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }\n        if (message === 'Forbidden') return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }\n        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }\n      }\n    }\n  })`
      }
      if (['apiSuccess', 'apiCreated'].includes(n)) return `  ${n}: vi.fn((_data: any) => ({ status: 200, json: () => Promise.resolve({ success: true, data: _data }) }))`
      if (n === 'apiPaginated') return `  ${n}: vi.fn((_data: any, total: number, page: number, limit: number) => ({ status: 200, json: () => Promise.resolve({ success: true, data: _data, meta: { page, limit, total, totalPages: Math.ceil(total / limit || 1), hasMore: page * (limit || 1) < total } }) }))`
      if (['apiError'].includes(n)) return `  ${n}: vi.fn((message: any, status?: number) => ({ status: status || 400, json: () => Promise.resolve({ error: message }) }))`
      if (['apiNotFound'].includes(n)) return `  ${n}: vi.fn((message: any) => ({ status: 404, json: () => Promise.resolve({ error: message }) }))`
      if (['apiForbidden'].includes(n)) return `  ${n}: vi.fn((message: any) => ({ status: 403, json: () => Promise.resolve({ error: message }) }))`
      if (module === 'env' && n === 'env') return `  ${n}: { CRON_SECRET: 'test-secret' }`
      return `  ${n}: vi.fn().mockReturnValue({ success: true })`
    }).join(',\n')
    testContent += `vi.mock('@/lib/${module}', () => ({\n`
    testContent += mockEntries + '\n'
    testContent += `}))\n\n`
  }

  const handlerImports = methods.map(m => `import { ${m} } from '@/${routePath.replace(/\\/g, '/').replace(/\.ts$/, '')}'`).join('\n')

  const authHelperImports = []
  if (content.includes('/auth/helpers') || content.includes('/auth/auth-options')) {
    authHelperImports.push(`import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'`)
  }
  if (content.includes('/auth/permissions')) {
    authHelperImports.push(`import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'`)
  }

  testContent += handlerImports + '\n'
  if (authHelperImports.length > 0) {
    testContent += authHelperImports.join('\n') + '\n'
  }
  testContent += '\n'

  const methodStr = methods.map(m => m.toLowerCase()).join('/')
  testContent += `describe('${methodStr.toUpperCase()} /api/${relPath}', () => {\n`
  testContent += `  beforeEach(() => {\n`
  testContent += `    vi.clearAllMocks()\n`
  testContent += `    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))\n`
  if (content.includes('/auth/helpers') || content.includes('/auth/auth-options')) {
    testContent += `    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })\n`
    testContent += `    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })\n`
    testContent += `    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })\n`
    testContent += `    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })\n`
  }
  if (routeUrl.includes('/cron/')) {
    testContent += `    vi.stubEnv('CRON_SECRET', 'test-secret')\n`
  }
  testContent += `  })\n\n`
  if (routeUrl.includes('/cron/')) {
    testContent += `  afterEach(() => { vi.unstubAllEnvs() })\n\n`
  }

  for (const method of methods) {
    const lowerMethod = method.toLowerCase()
    testContent += `  describe('${method}', () => {\n`

    if (lowerMethod === 'get') {
      const isDetail = /\[[^\]]+\]$/.test(relPath)
      const isCron = routeUrl.includes('/cron/')
      if (isCron) {
        testContent += `    it('returns 401 without cron secret', async () => {\n`
        testContent += `      const req = new NextRequest('http://localhost${routeUrl}')\n`
        testContent += `      const res = await (${method} as any)(req)\n`
        testContent += `      expect(res.status).toBe(401)\n`
        testContent += `    })\n\n`
        testContent += `    it('returns 200 with valid cron secret', async () => {\n`
        testContent += `      const modelNames = Object.keys(prismaMock).filter(k => !k.startsWith('$'))\n`
        testContent += `      for (const name of modelNames) {\n`
        testContent += `        const model = (prismaMock as any)[name]\n`
        testContent += `        if (model.findMany) model.findMany.mockResolvedValueOnce([])\n`
        testContent += `        if (model.count) model.count.mockResolvedValueOnce(0)\n`
        testContent += `        if (model.updateMany) model.updateMany.mockResolvedValueOnce({ count: 0 })\n`
        testContent += `        if (model.create) model.create.mockResolvedValueOnce({})\n`
        testContent += `      }\n`
        testContent += `      const req = new NextRequest('http://localhost${routeUrl}', {\n`
        testContent += `        headers: { Authorization: 'Bearer test-secret' },\n`
        testContent += `      })\n`
        testContent += `      const res = await (${method} as any)(req)\n`
        testContent += `      expect(res.status).toBe(200)\n`
        testContent += `      const json = await res.json()\n`
        testContent += `      expect(json).toBeDefined()\n`
        testContent += `    })\n\n`
      } else if (isDetail) {
        testContent += `    it('returns 200 with data when resource exists', async () => {\n`
        testContent += `      ${prismaModel(getModelName(relPath))}.findUnique.mockResolvedValueOnce({ id: '1', name: 'Test' } as any)\n`
        testContent += `      const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {\n`
        testContent += `        headers: { Authorization: 'Bearer test-secret' },\n`
        testContent += `      })\n`
        testContent += `      const res = await (${method} as any)(req, { params: { ${paramsObj} } })\n`
        testContent += `      expect(res.status).toBe(200)\n`
        testContent += `      const json = await res.json()\n`
        testContent += `      expect(json.success ?? json.data).toBeDefined()\n`
        testContent += `    })\n\n`
        testContent += `    it('returns 404 when resource not found', async () => {\n`
        testContent += `      ${prismaModel(getModelName(relPath))}.findUnique.mockResolvedValueOnce(null as any)\n`
        testContent += `      const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {\n`
        testContent += `        headers: { Authorization: 'Bearer test-secret' },\n`
        testContent += `      })\n`
        testContent += `      const res = await (${method} as any)(req, { params: { ${paramsObj} } })\n`
        testContent += `      expect(res.status).toBe(404)\n`
        testContent += `    })\n\n`
      } else {
        testContent += `    it('returns paginated list', async () => {\n`
        testContent += `      prismaMock.user.findMany.mockResolvedValueOnce([{ id: '1' }] as any)\n`
        testContent += `      prismaMock.user.count.mockResolvedValueOnce(1)\n`
        testContent += `      const req = new NextRequest('http://localhost${routeUrl}?page=1&limit=20', {\n`
        testContent += `        headers: { Authorization: 'Bearer test-secret' },\n`
        testContent += `      })\n`
        testContent += `      const res = await (${method} as any)(req)\n`
        testContent += `      expect(res.status).toBe(200)\n`
        testContent += `      const json = await res.json()\n`
        testContent += `      expect(json.data || Array.isArray(json)).toBe(true)\n`
        testContent += `    })\n\n`
        testContent += `    it('returns empty list when no data', async () => {\n`
        testContent += `      prismaMock.user.findMany.mockResolvedValueOnce([])\n`
        testContent += `      prismaMock.user.count.mockResolvedValueOnce(0)\n`
        testContent += `      const req = new NextRequest('http://localhost${routeUrl}', {\n`
        testContent += `        headers: { Authorization: 'Bearer test-secret' },\n`
        testContent += `      })\n`
        testContent += `      const res = await (${method} as any)(req)\n`
        testContent += `      expect(res.status).toBe(200)\n`
        testContent += `      const json = await res.json()\n`
        testContent += `      expect(json.data || Array.isArray(json)).toBe(true)\n`
        testContent += `    })\n\n`
      }
    } else if (lowerMethod === 'post') {
      const isWithParams = paramNames.length > 0
      const paramsArg = isWithParams ? `, { params: { ${paramsObj} } } as any` : ''
      testContent += `    it('returns 401 when unauthenticated', async () => {\n`
      if (content.includes('/auth/helpers') || content.includes('/auth/auth-options')) {
        testContent += `      ;(getAuthSession as any).mockResolvedValueOnce(null)\n`
      }
      testContent += `      const req = new NextRequest('http://localhost${routeUrl}', {\n`
      testContent += `        method: 'POST',\n`
      testContent += `        body: JSON.stringify({}),\n`
      testContent += `      })\n`
      testContent += `      const res = await (${method} as any)(req${paramsArg})\n`
      testContent += `      expect(res.status).toBe(401)\n`
      testContent += `    })\n\n`
      testContent += `    it('returns 400 for invalid input', async () => {\n`
      testContent += `      const req = new NextRequest('http://localhost${routeUrl}', {\n`
      testContent += `        method: 'POST',\n`
      testContent += `        body: JSON.stringify({ invalid: 'data' }),\n`
      testContent += `      })\n`
      testContent += `      const res = await (${method} as any)(req${paramsArg})\n`
      testContent += `      expect(res.status).toBe(400)\n`
      testContent += `    })\n\n`
      testContent += `    it('creates resource on valid input', async () => {\n`
      const schemaDefaults = getSchemaDefaults(content)
      const bodyJson = JSON.stringify(schemaDefaults)
      testContent += `      const req = new NextRequest('http://localhost${routeUrl}', {\n`
      testContent += `        method: 'POST',\n`
      testContent += `        body: ${bodyJson},\n`
      testContent += `      })\n`
      testContent += `      const res = await (${method} as any)(req${paramsArg})\n`
      testContent += `      expect(res.status).toBe(200)\n`
      testContent += `    })\n\n`
    } else if (lowerMethod === 'patch' || lowerMethod === 'put') {
      const isWithParams = paramNames.length > 0
      const paramsArg = isWithParams ? `, { params: { ${paramsObj} } } as any` : ''
      testContent += `    it('returns 401 when unauthenticated', async () => {\n`
      testContent += `      getAuthSession.mockResolvedValueOnce(null)\n`
      testContent += `      const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {\n`
      testContent += `        method: '${method.toUpperCase()}',\n`
      testContent += `        body: JSON.stringify({}),\n`
      testContent += `      })\n`
      testContent += `      const res = await (${method} as any)(req${paramsArg})\n`
      testContent += `      expect([401, 403]).toContain(res.status)\n`
      testContent += `    })\n\n`
      testContent += `    it('returns 404 when resource not found', async () => {\n`
      testContent += `      ${prismaModel(getModelName(relPath))}.findUnique.mockResolvedValueOnce(null)\n`
      testContent += `      const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {\n`
      testContent += `        method: '${method.toUpperCase()}',\n`
      testContent += `        body: JSON.stringify({ name: 'Updated' }),\n`
      testContent += `      })\n`
      testContent += `      const res = await (${method} as any)(req${paramsArg})\n`
      testContent += `      expect(res.status).toBe(404)\n`
      testContent += `    })\n\n`
    } else if (lowerMethod === 'delete') {
      const isWithParams = paramNames.length > 0
      const paramsArg = isWithParams ? `, { params: { ${paramsObj} } } as any` : ''
      testContent += `    it('returns 401 when unauthenticated', async () => {\n`
      testContent += `      getAuthSession.mockResolvedValueOnce(null)\n`
      testContent += `      const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {\n`
      testContent += `        method: 'DELETE',\n`
      testContent += `      })\n`
      testContent += `      const res = await (${method} as any)(req${paramsArg})\n`
      testContent += `      expect([401, 403]).toContain(res.status)\n`
      testContent += `    })\n\n`
      testContent += `    it('returns 404 when resource not found', async () => {\n`
      testContent += `      ${prismaModel(getModelName(relPath))}.findUnique.mockResolvedValueOnce(null)\n`
      testContent += `      const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {\n`
      testContent += `        method: 'DELETE',\n`
      testContent += `      })\n`
      testContent += `      const res = await (${method} as any)(req${paramsArg})\n`
      testContent += `      expect(res.status).toBe(404)\n`
      testContent += `    })\n\n`
    }

    testContent += `  })\n\n`
  }

  testContent += `})\n`

  const testFileDir = path.dirname(testFilePath)
  if (!fs.existsSync(testFileDir)) {
    fs.mkdirSync(testFileDir, { recursive: true })
  }

  fs.writeFileSync(testFilePath, testContent)
  return testFilePath
}

const allRoutes = []
for (const dir of dirs) {
  allRoutes.push(...getRouteFiles(dir))
}

console.log(`Found ${allRoutes.length} routes to test`)

let count = 0
for (const routePath of allRoutes) {
  const routeFullPath = path.join(root, routePath)
  const content = fs.readFileSync(routeFullPath, 'utf-8')
  const methods = detectMethods(content)
  if (methods.length === 0) continue

  const testFilePath = generateTest(routePath, content)
  if (testFilePath) {
    console.log(`Wrote: ${testFilePath}`)
    count++
  }
}

console.log(`\nGenerated ${count} test files`)
