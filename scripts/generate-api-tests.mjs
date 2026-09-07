import fs from 'fs'
import path from 'path'

const root = process.cwd()
const testDir = path.join(root, 'tests/integration/api')

const dirs = [
  'app/api/applicant',
  'app/api/instructor',
  'app/api/student',
  'app/api/staff/classes',
  'app/api/staff/courses',
  'app/api/staff/enrollments',
  'app/api/staff/exam-events',
  'app/api/staff/exam-pools',
  'app/api/staff/exam-sittings',
  'app/api/staff/exams',
]

const excludeFiles = new Set([
  'app/api/student/wallet/route.ts',
  'app/api/student/wallet/top-up/route.ts',
  'app/api/student/wallet/transactions/route.ts',
  'app/api/student/wallet/upload-proof/route.ts',
  'app/api/staff/classes/route.ts',
  'app/api/staff/courses/route.ts',
  'app/api/staff/enrollments/route.ts',
])

function getRouteFiles(dir) {
  const fullDir = path.join(root, dir)
  if (!fs.existsSync(fullDir)) return []
  const files = []
  const entries = fs.readdirSync(fullDir)
  for (const entry of entries) {
    const fullPath = path.join(fullDir, entry)
    const stat = fs.statSync(fullPath)
    if (entry === 'route.ts' && stat.isFile()) {
      const routePath = path.join(dir, entry).replace(/\\/g, '/')
      if (!excludeFiles.has(routePath)) {
        files.push(routePath)
      }
    } else if (stat.isDirectory()) {
      files.push(...getRouteFiles(path.join(dir, entry)))
    }
  }
  return files
}

function getAuthHelper(routePath, content) {
  if (/requireStaff/.test(content)) return 'requireStaff'
  if (/requireInstructor/.test(content)) return 'requireInstructor'
  if (/requireStudent/.test(content)) return 'requireStudent'
  if (/requireApplicant/.test(content)) return 'requireApplicant'
  if (/requireAuth/.test(content)) return 'requireAuth'
  if (/requireAdmin/.test(content)) return 'requireAdmin'
  if (/getAuthSession/.test(content)) return 'getAuthSession'
  if (routePath.includes('/staff/')) return 'requireStaff'
  if (routePath.includes('/instructor/')) return 'requireInstructor'
  if (routePath.includes('/student/')) return 'requireStudent'
  if (routePath.includes('/applicant/')) return 'requireApplicant'
  return 'requireStaff'
}

function getRole(routePath) {
  if (routePath.includes('/staff/')) return 'ADMIN'
  if (routePath.includes('/instructor/')) return 'INSTRUCTOR'
  if (routePath.includes('/student/')) return 'STUDENT'
  if (routePath.includes('/applicant/')) return 'APPLICANT'
  return 'ADMIN'
}

function getTestFileName(routePath) {
  const normalized = routePath.replace(/\\/g, '/')
  return normalized
    .replace('app/api/', '')
    .replace(/\/route\.ts$/, '')
    .replace(/\[([^\]]+)\]/g, '-$1')
    .replace(/\//g, '-') + '.test.ts'
}

function detectMethods(content) {
  const methods = []
  if (/\bexport\s+const\s+GET\b/.test(content) || /\bexport\s+async\s+function\s+GET\b/.test(content)) methods.push('GET')
  if (/\bexport\s+const\s+POST\b/.test(content) || /\bexport\s+async\s+function\s+POST\b/.test(content)) methods.push('POST')
  if (/\bexport\s+const\s+PATCH\b/.test(content) || /\bexport\s+async\s+function\s+PATCH\b/.test(content)) methods.push('PATCH')
  if (/\bexport\s+const\s+PUT\b/.test(content) || /\bexport\s+async\s+function\s+PUT\b/.test(content)) methods.push('PUT')
  if (/\bexport\s+const\s+DELETE\b/.test(content) || /\bexport\s+async\s+function\s+DELETE\b/.test(content)) methods.push('DELETE')
  return methods
}

function detect404Pattern(content) {
  return content.includes('apiNotFound')
    || /apiError\(.*404/.test(content)
    || /not found.*404/i.test(content)
    || /NextResponse\.json.*status.*404/.test(content)
    || /return.*404/.test(content)
}

function detect404Pattern(content) {
  return content.includes('apiNotFound')
    || /apiError\(.*404/.test(content)
    || /not found.*404/i.test(content)
    || /NextResponse\.json.*status.*404/.test(content)
    || /return.*404/.test(content)
}

function detect404Pattern(content) {
  return content.includes('apiNotFound')
    || /apiError\(.*404/.test(content)
    || /not found.*404/i.test(content)
    || /NextResponse\.json.*status.*404/.test(content)
    || /return.*404/.test(content)
}

function getModelNames(content) {
  const models = new Set()
  const regex = /prisma(?:Unfiltered)?\.([a-zA-Z]+)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    models.add(match[1])
  }
  return Array.from(models)
}

function getPrimaryModel(routePath) {
  const cleanPath = routePath.replace(/\\/g, '/').replace(/\/route\.ts$/, '')
  const parts = cleanPath.split('/')
  const lastPart = parts[parts.length - 1].replace(/[\[\]]/g, '')
  const secondLast = parts.length >= 2 ? parts[parts.length - 2].replace(/[\[\]]/g, '') : ''

  const modelMap = {
    'dashboard': 'user',
    'profile': 'profile',
    'documents': 'applicationDocument',
    'courses': 'course',
    'attendance': 'attendanceRecord',
    'grades': 'grade',
    'exams': 'examBooking',
    'notifications': 'notification',
    'certificates': 'examResult',
    'ojt': 'ojtLogbook',
    'milestones': 'paymentMilestone',
    'topbar-items': 'notification',
    'registration-fee': 'user',
    'classes': 'class',
    'enrollments': 'enrollment',
    'exam-events': 'examEvent',
    'exam-pools': 'examPool',
    'exam-sittings': 'examSitting',
    'members': 'poolMembership',
    'pools': 'examPool',
    'payments': 'payment',
    'referrals': 'referral',
    'bundles': 'examBundle',
    'memberships': 'poolMembership',
    'bookings': 'examBooking',
    'exam-components': 'examComponent',
    'interview-slots': 'interviewSlot',
    'interview-book': 'interviewSlot',
    'medical': 'application',
    'aptitude': 'aptitudeTestSession',
    'anti-cheat': 'aptitudeTestSession',
    'answer': 'aptitudeAnswer',
    'submit': 'aptitudeTestSession',
    'start': 'aptitudeTestSession',
    'session': 'aptitudeTestSession',
    'wallet': 'wallet',
    'top-up': 'payment',
    'transactions': 'walletTransaction',
    'upload-payment': 'payment',
    'pay-milestone': 'paymentMilestone',
    'pathway-payment': 'payment',
    'join-pool': 'poolMembership',
    'join-waitlist': 'poolWaitlist',
    'withdraw-pool': 'poolMembership',
    'book-exam': 'examBooking',
    'pricing': 'examPool',
    'materials': 'fileUpload',
    'seats': 'class',
    'seating': 'systemSetting',
    'roster': 'class',
    'batch-enroll': 'attendanceRecord',
    'approve': 'enrollment',
    'batch': 'enrollment',
    'evaluate': 'examEvent',
    'go-no-go': 'examEvent',
    'confirm': 'examPool',
    'merge': 'examPool',
    'charter': 'examPool',
    'questions': 'internalExamQuestion',
    'banks': 'internalExamBank',
    'preview': 'internalExamBank',
    'regrade': 'internalExamSession',
    'publish': 'internalExamSession',
    'void': 'internalExamSession',
    'sessions': 'internalExamSession',
    'review': 'internalExamQuestion',
    'manifest': 'examBooking',
    'internal': 'internalExamBank',
    'operations': 'internalExamSession',
    'my-bookings': 'poolMembership',
    'available': 'examPool',
    'update': 'examEvent',
  }

  const key = secondLast ? `${secondLast}-${lastPart}` : lastPart
  if (modelMap[key]) return modelMap[key]
  if (modelMap[lastPart]) return modelMap[lastPart]
  return lastPart
}

function hasIdParam(routeUrl) {
  return /\/:[^\/]+/.test(routeUrl)
}

function isGetDetail(content, routeUrl) {
  if (hasIdParam(routeUrl)) return true
  const primaryModel = getPrimaryModel(routeUrl)
  const primaryModelRegex = new RegExp(`prisma(?:Unfiltered)?\\.${primaryModel}\\.findUnique`)
  if (primaryModelRegex.test(content)) return true
  const detailKeywords = ['profile', 'dashboard', 'settings', 'receipt', 'invoice', 'exam-result', 'logbook']
  return detailKeywords.some(kw => routeUrl.includes(kw))
}

function usesGetAuthSession(content) {
  return content.includes('getAuthSession')
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

function _getValidBody(content) {
  const defaults = getSchemaDefaults(content)
  if (Object.keys(defaults).length > 0) {
    return JSON.stringify(defaults)
  }
  return '{}'
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

function _getValidBody(content) {
  const defaults = getSchemaDefaults(content)
  if (Object.keys(defaults).length > 0) {
    return JSON.stringify(defaults)
  }
  return '{}'
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

function _getValidBody(content) {
  const defaults = getSchemaDefaults(content)
  if (Object.keys(defaults).length > 0) {
    return JSON.stringify(defaults)
  }
  return '{}'
}

function getDefaultMockValues(model, content) {
  if (model === 'application') {
    const stageMatch = content.match(/application\.stage\s*!==\s*'([^']+)'/)
    if (stageMatch) return `, stage: '${stageMatch[1]}'`
    const stageMatchEq = content.match(/application\.stage\s*===\s*'([^']+)'/)
    if (stageMatchEq) {
      const rejectedStage = stageMatchEq[1]
      const oppositeStages = ['PENDING', 'INTERVIEW_PENDING', 'INTERVIEW_SCHEDULED', 'APTITUDE_PENDING', 'REVIEW', 'ACCEPTED']
      const safeStage = oppositeStages.find(s => s !== rejectedStage) || 'PENDING'
      return `, stage: '${safeStage}'`
    }
    const includesMatch = content.match(/\.includes\(app\.stage\)/)
    if (includesMatch) {
      const stagesMatch = content.match(/\['([^']+)'(?:,\s*'([^']+)')*\]/)
      if (stagesMatch) {
        return `, stage: '${stagesMatch[1]}'`
      }
    }
    return `, stage: 'PENDING'`
  }
  const defaults = {
    user: { email: 'test@test.com', role: 'USER' },
    profile: { userId: 'user-1' },
    examBooking: { status: 'CONFIRMED' },
    examPool: { status: 'ACTIVE' },
    class: { status: 'ACTIVE' },
    enrollment: { status: 'ACTIVE' },
    interviewSlot: { bookedCount: 0, capacity: 10 },
  }
  const vals = defaults[model]
  if (!vals) return ''
  return ', ' + Object.entries(vals).map(([k, v]) => `${k}: '${v}'`).join(', ')
}

function getRelationDefaults(model) {
  const relations = {
    interviewSchedule: { slots: [] },
    applicationDocument: { documentType: { id: '1' }, fileUpload: { id: '1' } },
    class: { course: { id: '1' }, instructor: { id: '1' } },
    enrollment: { course: { id: '1' }, student: { id: '1' } },
    examBooking: { examSitting: { id: '1' }, pool: { id: '1' } },
    examSitting: { examEvent: { id: '1' }, candidates: [] },
    examPool: { members: [], examEvents: [] },
    aptitudeTestSession: { answers: [], bank: { id: '1' } },
    payment: { user: { id: '1' } },
    referral: { referrer: { id: '1' }, referee: { id: '1' } },
  }
  const vals = relations[model]
  if (!vals) return ''
  return ', ' + Object.entries(vals).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')
}

function generateTest(routePath, content) {
  const methods = detectMethods(content)
  if (methods.length === 0) return ''

  const normalized = routePath.replace(/\\/g, '/')
  const routeUrl = '/' + normalized
    .replace('app/api/', '')
    .replace(/\/route\.ts$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')
  const paramNames = (routeUrl.match(/:([^/]+)/g) || []).map(m => m.substring(1))
  const paramsObj = paramNames.map(p => `${p}: '1'`).join(', ')
  const paramNames = (routeUrl.match(/:([^/]+)/g) || []).map(m => m.substring(1))
  const paramsObj = paramNames.map(p => `${p}: '1'`).join(', ')
  const paramNames = (routeUrl.match(/:([^/]+)/g) || []).map(m => m.substring(1))
  const paramsObj = paramNames.map(p => `${p}: '1'`).join(', ')

  const authHelper = getAuthHelper(routePath, content)
  const role = getRole(routePath)
  const _model = getPrimaryModel(routePath)
  const models = getModelNames(content)
  const hasGetAuthSession = usesGetAuthSession(content)

  const mockAuth = `vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: '${role}' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: '${role}' }),
  requireInstructor: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requirePermission: vi.fn(),
  requireExaminer: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
  generateStudentId: vi.fn().mockReturnValue('STU-001'),
}))`

  const mockAudit = `vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', PAYMENT_APPROVE: 'PAYMENT_APPROVE', ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE', SYSTEM: 'SYSTEM', WITHDRAW: 'WITHDRAW' },
}))`

  const mockEmail = `vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
  sendStudentPromotionEmail: vi.fn(),
  sendActivationEmail: vi.fn(),
}))`

  const _mockInternalExam = content.includes('isInternalExamSystemEnabled') || content.includes('/internal-exam/engine')
    ? `vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),
}))`
    : ''

  const extraMocks = []
  const libImports = content.matchAll(/from\s+['"]@\/lib\/([^'"]+)['"]/g)
  const seen = new Set()
  for (const match of libImports) {
    const mod = match[1]
    if (seen.has(mod)) continue
    seen.add(mod)
    if (mod === 'auth/helpers' || mod === 'audit/logger' || mod === 'email/service' || mod === 'internal-exam/engine' || mod === 'security/rate-limit' || mod === 'api/response' || mod === 'prisma/client' || mod === 'prisma/db-base') continue
    const importMatch = content.match(new RegExp(`import\\s+\\{\\s*([^}]+)\\s*\\}\\s+from\\s+['"]@/lib/${mod.replace(/\./g, '\\.')}['"]`))
    if (importMatch) {
      const names = importMatch[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
      const mockEntries = names.map(n => {
        if (n === 'serializePrisma') return `${n}: vi.fn((data) => data)`
        if (n === 'parsePagination') return `${n}: vi.fn(() => ({ page: 1, limit: 20, skip: 0 }))`
        if (n === 'parseSearch') return `${n}: vi.fn(() => undefined)`
        if (n === 'parseSorting') return `${n}: vi.fn(() => ({ sortBy: 'createdAt', sortOrder: 'desc' }))`
        if (n === 'cn') return `${n}: vi.fn((...args) => args.join(' '))`
        if (n === 'formatCurrency') return `${n}: vi.fn((amount) => '€' + amount)`
        if (n === 'formatDate') return `${n}: vi.fn(() => '2024-01-01')`
        if (n === 'formatDateTime') return `${n}: vi.fn(() => '2024-01-01T00:00:00.000Z')`
        if (n === 'proxyImageUrl') return `${n}: vi.fn(() => 'https://test.com/image.png')`
        if (n === 'getCurrencySymbol') return `${n}: vi.fn(() => '€')`
        return `${n}: vi.fn().mockResolvedValue({ success: true })`
      }).join(', ')
      extraMocks.push(`vi.mock('@/lib/${mod}', () => ({ ${mockEntries} }))`)
    } else {
      extraMocks.push(`vi.mock('@/lib/${mod}', () => ({ fn0: vi.fn().mockResolvedValue({ success: true }) }))`)
    }
  }

  const _beforeEachMocks = models.map(m => `    prismaMock.${m}.findUnique.mockResolvedValue(null as any)`).join('\n')

  const testBlocks = []

  if (methods.includes('GET')) {
    if (isGetDetail(content, routeUrl)) {
      const hasId = hasIdParam(routeUrl)
      const detailUrl = hasId ? routeUrl.replace(/:[^/]+/g, '1') : routeUrl
      const detailParams = paramNames.length > 0 ? `, { params: { ${paramsObj} } } as any` : ''
      const returns404 = detect404Pattern(content)
      testBlocks.push(`  it('returns 401 when unauthenticated', async () => {
    ;(${hasGetAuthSession ? 'getAuthSession' : authHelper} as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost${detailUrl}')
    const res = await (GET as any)(req${detailParams})
    expect(res.status).toBe(401)
  })

  it('returns 200 with data when resource exists', async () => {
    ${models.map(m => `prismaMock.${m}.findUnique.mockResolvedValue({ id: '1'${getDefaultMockValues(m, content)} } as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.findMany.mockResolvedValue([{ id: '1'${getRelationDefaults(m)} }] as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.count.mockResolvedValue(0)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.groupBy.mockResolvedValue([{ status: 'PRESENT', _count: 1 }] as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.aggregate.mockResolvedValue({ _count: 1 } as any)`).join('\n    ')}
    const req = new NextRequest('http://localhost${detailUrl}')
    const res = await (GET as any)(req${detailParams})
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })`)
      if (returns404) {
        testBlocks.push(`  it('returns 404 when resource not found', async () => {
    ${models.map(m => `prismaMock.${m}.findUnique.mockResolvedValueOnce(null)`).join('\n    ')}
    const req = new NextRequest('http://localhost${detailUrl}')
    const res = await (GET as any)(req${detailParams})
    expect(res.status).toBe(404)
  })`)
      }
    } else {
      testBlocks.push(`  it('returns 401 when unauthenticated', async () => {
    ;(${hasGetAuthSession ? 'getAuthSession' : authHelper} as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost${routeUrl}')
    const res = await (GET as any)(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with data', async () => {
    ${models.map(m => `prismaMock.${m}.findMany.mockResolvedValue([{ id: '1'${getRelationDefaults(m)} }] as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.findUnique.mockResolvedValue({ id: '1'${getDefaultMockValues(m, content)} } as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.count.mockResolvedValue(0)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.groupBy.mockResolvedValue([{ status: 'PRESENT', _count: 1 }] as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.aggregate.mockResolvedValue({ _count: 1 } as any)`).join('\n    ')}
    const req = new NextRequest('http://localhost${routeUrl}?page=1&limit=20')
    const res = await (GET as any)(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })`)
    }
  }

  if (methods.includes('POST')) {
    const _isWithParams = hasIdParam(routeUrl)
    const paramsArg = paramNames.length > 0 ? `, { params: { ${paramsObj} } } as any` : ''
    testBlocks.push(`  it('returns 401 when unauthenticated', async () => {
    ;(${hasGetAuthSession ? 'getAuthSession' : authHelper} as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost${routeUrl}', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await (POST as any)(req${paramsArg})
    expect(res.status).toBe(401)
  })

  it('returns 403 when forbidden', async () => {
    ;(${authHelper} as any).mockRejectedValueOnce(new Error('Forbidden'))
    const req = new NextRequest('http://localhost${routeUrl}', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await (POST as any)(req${paramsArg})
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid input', async () => {
    ;(${authHelper} as any).mockResolvedValueOnce(${authHelper === 'getAuthSession' ? `{ user: { id: 'user-1', email: 'test@test.com', role: '${role}' } }` : `{ id: 'user-1', role: '${role}' }`})
    ${models.map(m => `prismaMock.${m}.findUnique.mockResolvedValueOnce(null as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.findMany.mockResolvedValueOnce([{ id: '1'${getRelationDefaults(m)} }] as any)`).join('\n    ')}
    ${models.map(m => `prismaMock.${m}.count.mockResolvedValueOnce(0)`).join('\n    ')}
    const req = new NextRequest('http://localhost${routeUrl}', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await (POST as any)(req${paramsArg})
    expect([400, 404]).toContain(res.status)
  })`)
  }

  if (methods.includes('PATCH') || methods.includes('PUT')) {
    const method = methods.includes('PATCH') ? 'PATCH' : 'PUT'
    const _isWithParams = hasIdParam(routeUrl)
    const paramsArg = paramNames.length > 0 ? `, { params: { ${paramsObj} } } as any` : ''
    testBlocks.push(`  it('returns 401 when unauthenticated', async () => {
    ;(${hasGetAuthSession ? 'getAuthSession' : authHelper} as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {
      method: '${method}',
      body: JSON.stringify({}),
    })
    const res = await (${method} as any)(req${paramsArg})
    expect(res.status).toBe(401)
  })`)
    testBlocks.push(`  it('returns 403 when forbidden', async () => {
    ;(${authHelper} as any).mockRejectedValueOnce(new Error('Forbidden'))
    const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {
      method: '${method}',
      body: JSON.stringify({}),
    })
    const res = await (${method} as any)(req${paramsArg})
    expect(res.status).toBe(403)
  })`)
    if (isWithParams) {
      testBlocks.push(`  it('returns 404 when resource not found', async () => {
    ;(${authHelper} as any).mockResolvedValueOnce(${authHelper === 'getAuthSession' ? `{ user: { id: 'staff-1', email: 'test@test.com', role: '${role}' } }` : `{ id: 'staff-1', role: '${role}' }`})
    ${models.map(m => `prismaMock.${m}.findUnique.mockResolvedValueOnce(null)`).join('\n    ')}
    const req = new NextRequest('http://localhost${routeUrl}/1', {
      method: '${method}',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await (${method} as any)(req${paramsArg})
    expect(res.status).toBe(404)
  })`)
    }
  }

  if (methods.includes('DELETE')) {
    const _isWithParams = hasIdParam(routeUrl)
    const paramsArg = paramNames.length > 0 ? `, { params: { ${paramsObj} } } as any` : ''
    testBlocks.push(`  it('returns 401 when unauthenticated', async () => {
    ;(${hasGetAuthSession ? 'getAuthSession' : authHelper} as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {
      method: 'DELETE',
    })
    const res = await (DELETE as any)(req${paramsArg})
    expect(res.status).toBe(401)
  })`)
    testBlocks.push(`  it('returns 403 when forbidden', async () => {
    ;(${authHelper} as any).mockRejectedValueOnce(new Error('Forbidden'))
    const req = new NextRequest('http://localhost${routeUrl.replace(/:[^/]+/g, '1')}', {
      method: 'DELETE',
    })
    const res = await (DELETE as any)(req${paramsArg})
    expect(res.status).toBe(403)
  })`)
    if (isWithParams) {
      testBlocks.push(`  it('returns 404 when resource not found', async () => {
    ;(${authHelper} as any).mockResolvedValueOnce(${authHelper === 'getAuthSession' ? `{ user: { id: 'staff-1', email: 'test@test.com', role: '${role}' } }` : `{ id: 'staff-1', role: '${role}' }`})
    ${models.map(m => `prismaMock.${m}.findUnique.mockResolvedValueOnce(null)`).join('\n    ')}
    const req = new NextRequest('http://localhost${routeUrl}/1', {
      method: 'DELETE',
    })
    const res = await (DELETE as any)(req${paramsArg})
    expect(res.status).toBe(404)
  })`)
    }
  }

  const describeBlock = testBlocks.join('\n\n')

  const imports = [methods.join(', ')]
  if (hasGetAuthSession && authHelper !== 'getAuthSession') imports.push("getAuthSession")

  return `${mockAuth}
 ${mockAudit}
 ${mockEmail}
 ${extraMocks.join('\n')}

 import { describe, it, expect, vi, beforeEach } from 'vitest'
 import { prismaMock } from '@/tests/setup'
 import { NextRequest } from 'next/server'
 import { ${methods.join(', ')} } from '@/${normalized}'
 import { ${authHelper} } from '@/lib/auth/helpers'
 ${hasGetAuthSession && authHelper !== 'getAuthSession' ? "import { getAuthSession } from '@/lib/auth/helpers'\n" : ''}

describe('${routeUrl.replace(/\\/g, '/')}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(${authHelper} as any).mockResolvedValue(${authHelper === 'getAuthSession' ? `{ user: { id: 'user-1', email: 'test@test.com', role: '${role}' } }` : `{ id: 'user-1', role: '${role}' }`})
    prismaMock.notification.create.mockResolvedValue({} as any)
    ${models.map(m => `prismaMock.${m}.findUnique.mockResolvedValue(null as any)`).join('\n    ')}
  })

${describeBlock}
})
`
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

  const testContent = generateTest(routePath, content)
  if (!testContent) continue

  const testFileName = getTestFileName(routePath)
  const testFilePath = path.join(testDir, testFileName)
  const testFileDir = path.dirname(testFilePath)

  if (!fs.existsSync(testFileDir)) {
    fs.mkdirSync(testFileDir, { recursive: true })
  }

  fs.writeFileSync(testFilePath, testContent)
  count++
}

console.log(`Generated ${count} test files`)




