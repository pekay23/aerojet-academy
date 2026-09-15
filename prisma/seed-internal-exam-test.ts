import { Prisma, ApplicationStage, QuestionDifficulty, TestSessionStatus } from '@prisma/client'
import { prismaUnfiltered as prisma } from '../lib/prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// ── Guard: never run in production ────────────────────────────────
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_SEED) {
  throw new Error('Refusing to run test seed in production. Set ALLOW_TEST_SEED=true to override.')
}

const NOW = new Date()
const PASSWORD = await bcrypt.hash('123456', 12)

function daysFromNow(n: number) {
  return new Date(NOW.getTime() + n * 86400000)
}

async function main() {
  console.log('🌱 Seeding internal exam test data...')

  // ══════════════════════════════════════════════════════════════
  // STEP 0: SystemSettings (must be first — blocks all APIs if missing)
  // ══════════════════════════════════════════════════════════════
  await prisma.systemSetting.upsert({
    where: { key: 'internal_exam_system_enabled' },
    update: { value: 'true' },
    create: {
      key: 'internal_exam_system_enabled',
      value: 'true',
      type: 'BOOLEAN',
      description: 'Internal exam system on/off',
    },
  })
  await prisma.systemSetting.upsert({
    where: { key: 'certificates_enabled' },
    update: { value: 'true' },
    create: {
      key: 'certificates_enabled',
      value: 'true',
      type: 'BOOLEAN',
      description: 'Certificate generation on/off',
    },
  })
  await prisma.systemSetting.upsert({
    where: { key: 'pdf_template_system_enabled' },
    update: { value: 'true' },
    create: {
      key: 'pdf_template_system_enabled',
      value: 'true',
      type: 'BOOLEAN',
      description: 'PDF template system on/off',
    },
  })
  console.log('✅ SystemSettings seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 1: System user (for audit logs)
  // ══════════════════════════════════════════════════════════════
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@test.com' },
    update: {},
    create: {
      email: 'superadmin@test.com',
      password: PASSWORD,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: NOW,
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
    },
  })
  console.log('✅ System user created')

  // ══════════════════════════════════════════════════════════════
  // STEP 2: Reference / Lookup tables
  // ══════════════════════════════════════════════════════════════
  // Step 2: Reference / Lookup tables - IntakeCycle (upsert requires id or unique filter)
  let intakeCycle = await prisma.intakeCycle.findFirst({ where: { name: '2025-2026 Intake' } })
  if (!intakeCycle) {
    intakeCycle = await prisma.intakeCycle.create({
      data: {
        name: '2025-2026 Intake',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-07-31'),
        isActive: true,
      },
    })
  }

  const docTypeConfigs = [
    {
      slug: 'id_copy',
      name: 'National ID Copy',
      fileTypes: 'application/pdf,image/jpeg,image/png',
      maxSizeMB: 4,
      isRequired: true,
      applicableProgrammes: [],
      sortOrder: 1,
    },
    {
      slug: 'passport_photo',
      name: 'Passport Photo',
      fileTypes: 'image/jpeg,image/png',
      maxSizeMB: 4,
      isRequired: true,
      applicableProgrammes: [],
      sortOrder: 2,
    },
    {
      slug: 'medical_cert',
      name: 'Medical Certificate',
      fileTypes: 'application/pdf',
      maxSizeMB: 4,
      isRequired: true,
      applicableProgrammes: [],
      sortOrder: 3,
    },
    {
      slug: 'qualification_cert',
      name: 'Academic Qualifications',
      fileTypes: 'application/pdf',
      maxSizeMB: 10,
      isRequired: true,
      applicableProgrammes: [],
      sortOrder: 4,
    },
    {
      slug: 'passport',
      name: 'Passport Copy',
      fileTypes: 'application/pdf,image/jpeg,image/png',
      maxSizeMB: 4,
      isRequired: true,
      applicableProgrammes: [],
      sortOrder: 5,
    },
  ]
  for (const cfg of docTypeConfigs) {
    await prisma.applicationDocumentType.upsert({
      where: { slug: cfg.slug },
      update: {},
      create: cfg,
    })
  }
  console.log('✅ Reference tables seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 3: Instructor user + profile + passkey + RBAC grants
  // ══════════════════════════════════════════════════════════════
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor.internal@test.com' },
    update: {},
    create: {
      email: 'instructor.internal@test.com',
      password: PASSWORD,
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      emailVerified: NOW,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      passwordChanged: false,
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Instructor',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
          phone: '+233200000010',
          address: '123 Aviation Rd, Accra',
        },
      },
      instructorProfile: {
        create: {
          employeeId: 'IN-TEST-002',
          department: 'Flight Training',
          specialization: 'Aircraft Systems',
          modulesQualified: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'],
        },
      },
      wallet: { create: { balance: 0, reservedBalance: 0, availableBalance: 0, currency: 'EUR' } },
    },
  })

  // Passkey credential (direct DB insert)
  await prisma.passkey.upsert({
    where: { id: 'passkey-instructor-test' },
    update: {},
    create: {
      id: 'passkey-instructor-test',
      userId: instructor.id,
      name: 'Test Passkey',
      publicKey: Buffer.from(crypto.randomBytes(64)),
      credentialId: crypto.randomBytes(32).toString('base64'),
      counter: BigInt(0),
      deviceType: 'singleDevice',
      backedUp: false,
      transports: ['internal'],
      createdAt: NOW,
    },
  })
  console.log('✅ Instructor + passkey seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 4: Staff test account (R3-INT-9)
  // ══════════════════════════════════════════════════════════════
  const _staff = await prisma.user.upsert({
    where: { email: 'staff.exam@test.com' },
    update: {},
    create: {
      email: 'staff.exam@test.com',
      password: PASSWORD,
      role: 'STAFF',
      status: 'ACTIVE',
      emailVerified: NOW,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      passwordChanged: false,
      profile: {
        create: {
          firstName: 'Exam',
          lastName: 'Staff',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
          phone: '+233200000020',
          address: '456 Admin Blvd, Accra',
        },
      },
      staffProfile: {
        create: {
          employeeId: 'ST-TEST-002',
          department: 'Exams Department',
          position: 'Exam Coordinator',
        },
      },
      wallet: { create: { balance: 0, reservedBalance: 0, availableBalance: 0, currency: 'EUR' } },
    },
  })
  console.log('✅ Staff account seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 5: Student user + profile + studentProfile + license targets
  // ══════════════════════════════════════════════════════════════
  const student = await prisma.user.upsert({
    where: { email: 'student.internal@test.com' },
    update: {},
    create: {
      email: 'student.internal@test.com',
      password: PASSWORD,
      role: 'STUDENT',
      status: 'ACTIVE',
      academyEmail: 'k.owusu2@aerojet-academy.com',
      emailVerified: NOW,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      passwordChanged: false,
      programmeChoice: 'FULL_TIME_2YEAR',
      selectedLicenseCategories: ['B1', 'B2'],
      profile: {
        create: {
          firstName: 'Kwame',
          lastName: 'Student',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
          phone: '+233200000030',
          address: '789 Learner St, Accra',
        },
      },
      wallet: {
        create: { balance: 500000, reservedBalance: 0, availableBalance: 500000, currency: 'EUR' },
      },
    },
  })
  console.log('✅ Student account seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 6: Negative test accounts (R2-QA-3)
  // ══════════════════════════════════════════════════════════════
  const _lockedStudent = await prisma.user.upsert({
    where: { email: 'locked.student@test.com' },
    update: {},
    create: {
      email: 'locked.student@test.com',
      password: PASSWORD,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: NOW,
      loginAttempts: 5,
      lockedUntil: daysFromNow(1),
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Locked',
          lastName: 'Student',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
    },
  })
  const _suspendedStudent = await prisma.user.upsert({
    where: { email: 'suspended.student@test.com' },
    update: {},
    create: {
      email: 'suspended.student@test.com',
      password: PASSWORD,
      role: 'STUDENT',
      status: 'SUSPENDED',
      emailVerified: NOW,
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Suspended',
          lastName: 'Student',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
    },
  })
  console.log('✅ Negative test accounts seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 7: Academic structure
  // ══════════════════════════════════════════════════════════════
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2025-2026' },
    update: {},
    create: {
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-31'),
      isActive: true,
    },
  })
  const semester = await prisma.semester.upsert({
    where: { id: '2025-2026-S1' },
    update: {},
    create: {
      id: '2025-2026-S1',
      name: 'Semester 1',
      academicYearId: academicYear.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-30'),
      isActive: true,
    },
  })

  // Course categories
  const airframe = await prisma.courseCategory.upsert({
    where: { name: 'AIRFRAME' },
    update: {},
    create: { name: 'AIRFRAME', description: 'Airframe modules' },
  })
  const powerplant = await prisma.courseCategory.upsert({
    where: { name: 'POWERPLANT' },
    update: {},
    create: { name: 'POWERPLANT', description: 'Powerplant modules' },
  })
  const core = await prisma.courseCategory.upsert({
    where: { name: 'CORE' },
    update: {},
    create: { name: 'CORE', description: 'Core modules' },
  })

  // Courses (M1-M7)
  const courses: Record<string, { id: string }> = {}
  const courseData = [
    {
      code: 'M1',
      name: 'Mathematics',
      subtitle: 'Arithmetic · Algebra · Geometry',
      duration: 120,
      price: 2500.0,
      categoryId: core.id,
      moduleType: 'CORE' as const,
      easaModule: 'Module 1',
    },
    {
      code: 'M2',
      name: 'Physics',
      subtitle: 'Matter · Mechanics · Thermodynamics',
      duration: 120,
      price: 2500.0,
      categoryId: core.id,
      moduleType: 'CORE' as const,
      easaModule: 'Module 3',
    },
    {
      code: 'M3',
      name: 'Electrical Fundamentals',
      subtitle: 'DC/AC Theory · Circuits · Motors',
      duration: 80,
      price: 2000.0,
      categoryId: core.id,
      moduleType: 'CORE' as const,
      easaModule: 'Module 5',
    },
    {
      code: 'M4',
      name: 'Airframe Structures',
      subtitle: 'Structures & Systems',
      duration: 100,
      price: 3000.0,
      categoryId: airframe.id,
      moduleType: 'SPECIALIST' as const,
      easaModule: 'Module 11A',
    },
    {
      code: 'M5',
      name: 'Powerplant Systems',
      subtitle: 'Engine Systems',
      duration: 100,
      price: 3000.0,
      categoryId: powerplant.id,
      moduleType: 'SPECIALIST' as const,
      easaModule: 'Module 11B',
    },
    {
      code: 'M6',
      name: 'Human Factors',
      subtitle: 'Performance · Error · CRM',
      duration: 40,
      price: 1500.0,
      categoryId: core.id,
      moduleType: 'CORE' as const,
      easaModule: 'Module 10',
    },
    {
      code: 'M7',
      name: 'Maintenance Practices',
      subtitle: 'Safety · Tools · Inspection',
      duration: 60,
      price: 1800.0,
      categoryId: core.id,
      moduleType: 'CORE' as const,
      easaModule: 'Module 7',
    },
  ]
  for (const c of courseData) {
    const created = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        subtitle: c.subtitle,
        duration: c.duration,
        price: c.price,
        categoryId: c.categoryId,
        moduleType: c.moduleType,
        isActive: true,
      },
    })
    courses[c.code] = { id: created.id }
  }
  console.log('✅ Courses seeded')

  // Exam Components (3 options per MCQ — EASA Part-66 standard)
  const componentData = [
    { code: 'M1-MATH', courseCode: 'M1', type: 'MCQ' as const, duration: 90, passMarkPct: 75 },
    {
      code: 'M1-MATH-ESSAY',
      courseCode: 'M1',
      type: 'ESSAY' as const,
      duration: 60,
      passMarkPct: 75,
    },
    { code: 'M2-PHYS', courseCode: 'M2', type: 'MCQ' as const, duration: 90, passMarkPct: 75 },
    { code: 'M3-ELEC', courseCode: 'M3', type: 'MCQ' as const, duration: 90, passMarkPct: 75 },
    { code: 'M4-AIRFRAME', courseCode: 'M4', type: 'MCQ' as const, duration: 90, passMarkPct: 75 },
    {
      code: 'M5-POWERPLANT',
      courseCode: 'M5',
      type: 'MCQ' as const,
      duration: 90,
      passMarkPct: 75,
    },
    { code: 'M6-HF', courseCode: 'M6', type: 'MCQ' as const, duration: 60, passMarkPct: 75 },
    { code: 'M7-MP', courseCode: 'M7', type: 'MCQ' as const, duration: 90, passMarkPct: 75 },
    {
      code: 'M7-MP-ESSAY',
      courseCode: 'M7',
      type: 'ESSAY' as const,
      duration: 60,
      passMarkPct: 75,
    },
  ]
  for (const ec of componentData) {
    await prisma.examComponent.upsert({
      where: { code: ec.code },
      update: {},
      create: {
        code: ec.code,
        courseId: courses[ec.courseCode].id,
        name: `${ec.courseCode} ${ec.type}`,
        type: ec.type,
        questionCount: ec.type === 'MCQ' ? 40 : 2,
        duration: ec.duration,
        individualPrice: 520.0,
        poolPrice: 300.0,
        categoryCode:
          ec.courseCode === 'M1'
            ? 'B1'
            : ec.courseCode === 'M2'
              ? 'B2'
              : ec.courseCode === 'M3'
                ? 'B2'
                : ec.courseCode === 'M4'
                  ? 'B1'
                  : ec.courseCode === 'M5'
                    ? 'B1'
                    : ec.courseCode === 'M6'
                      ? 'B2'
                      : 'B2',
      },
    })
  }
  console.log('✅ Exam components seeded')

  // StudyPathwayModel, FullTimeProgramme, ProgrammeYear
  const pathway = await prisma.studyPathwayModel.upsert({
    where: { code: 'FULL_TIME_2YEAR' },
    update: {},
    create: {
      code: 'FULL_TIME_2YEAR',
      name: 'Full-Time 2-Year B1/B2',
      description: 'Standard full-time pathway for B1 and B2 license categories',
      requiresAutoEnrollment: true,
      grantsTuitionAccess: true,
      includesOjt: true,
    },
  })
  const ftProgramme = await prisma.fullTimeProgramme.upsert({
    where: { code: 'FULL_TIME_2YEAR' },
    update: {},
    create: {
      code: 'FULL_TIME_2YEAR',
      name: 'Full-Time 2-Year B1/B2',
      durationYears: 2,
      totalFee: 22500.0,
      description: 'Standard full-time B1/B2 pathway',
      isActive: true,
    },
  })
  const progYear1 = await prisma.programmeYear.upsert({
    where: { programmeId_yearNumber: { programmeId: ftProgramme.id, yearNumber: 1 } },
    update: {},
    create: { programmeId: ftProgramme.id, yearNumber: 1, isActive: true },
  })
  const _progYear2 = await prisma.programmeYear.upsert({
    where: { programmeId_yearNumber: { programmeId: ftProgramme.id, yearNumber: 2 } },
    update: {},
    create: { programmeId: ftProgramme.id, yearNumber: 2, isActive: true },
  })

  // LicenseCategory + StudentLicenseTarget (must be before AcademicTerm)
  const licB1 = await prisma.licenseCategory.upsert({
    where: { code: 'B1' },
    update: {},
    create: { code: 'B1', name: 'B1 Mechanical', description: 'Mechanical maintenance license' },
  })
  const licB2 = await prisma.licenseCategory.upsert({
    where: { code: 'B2' },
    update: {},
    create: {
      code: 'B2',
      name: 'B2 Avionics',
      description: 'Avionics/electrical maintenance license',
    },
  })
  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      studentId: 'AJA-TEST-0001',
      enrollmentType: 'FULL_TIME',
      currentYearNumber: 1,
      currentSemesterNumber: 1,
    },
  })
  await prisma.studentLicenseTarget.upsert({
    where: {
      studentProfileId_licenseCategoryId: {
        studentProfileId: studentProfile.id,
        licenseCategoryId: licB1.id,
      },
    },
    update: {},
    create: { studentProfileId: studentProfile.id, licenseCategoryId: licB1.id },
  })
  await prisma.studentLicenseTarget.upsert({
    where: {
      studentProfileId_licenseCategoryId: {
        studentProfileId: studentProfile.id,
        licenseCategoryId: licB2.id,
      },
    },
    update: {},
    create: { studentProfileId: studentProfile.id, licenseCategoryId: licB2.id },
  })
  console.log('✅ License categories seeded')

  // AcademicTerm + TermCourseAssignment
  const _termB1 = await prisma.academicTerm.upsert({
    where: { id: 'term-Y1S1-B1' },
    update: {},
    create: {
      id: 'term-Y1S1-B1',
      pathwayId: pathway.id,
      yearNumber: 1,
      semesterNumber: 1,
      licenseCategoryId: licB1.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-30'),
    },
  })
  const _termB2 = await prisma.academicTerm.upsert({
    where: { id: 'term-Y1S1-B2' },
    update: {},
    create: {
      id: 'term-Y1S1-B2',
      pathwayId: pathway.id,
      yearNumber: 1,
      semesterNumber: 1,
      licenseCategoryId: licB2.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-30'),
    },
  })
  const termCourseAssignments = [
    { termId: 'term-Y1S1-B1', courseCode: 'M1' },
    { termId: 'term-Y1S1-B1', courseCode: 'M2' },
    { termId: 'term-Y1S1-B1', courseCode: 'M3' },
    { termId: 'term-Y1S1-B1', courseCode: 'M4' },
    { termId: 'term-Y1S1-B1', courseCode: 'M6' },
    { termId: 'term-Y1S1-B1', courseCode: 'M7' },
    { termId: 'term-Y1S1-B2', courseCode: 'M1' },
    { termId: 'term-Y1S1-B2', courseCode: 'M2' },
    { termId: 'term-Y1S1-B2', courseCode: 'M3' },
    { termId: 'term-Y1S1-B2', courseCode: 'M5' },
    { termId: 'term-Y1S1-B2', courseCode: 'M6' },
    { termId: 'term-Y1S1-B2', courseCode: 'M7' },
  ]
  for (const ta of termCourseAssignments) {
    await prisma.termCourseAssignment.upsert({
      where: { termId_courseId: { termId: ta.termId, courseId: courses[ta.courseCode].id } },
      update: {},
      create: { termId: ta.termId, courseId: courses[ta.courseCode].id },
    })
  }
  console.log('✅ Academic structure seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 8: Classrooms
  // ══════════════════════════════════════════════════════════════
  const classroomConfigs = [
    { name: 'CR-A', capacity: 30, type: 'Lecture' },
    { name: 'CR-B', capacity: 28, type: 'Lecture' },
    { name: 'CR-C', capacity: 20, type: 'Workshop' },
    { name: 'CR-D', capacity: 20, type: 'Workshop' },
  ]
  const classrooms = await Promise.all(
    classroomConfigs.map(async (c) => {
      const existing = await prisma.classroom.findFirst({ where: { name: c.name } })
      if (existing) return existing
      return prisma.classroom.create({ data: c })
    })
  )
  const classroomMap = Object.fromEntries(classrooms.map((c) => [c.name, c.id]))
  console.log('✅ Classrooms seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 9: Application + stage logs + supporting documents
  // ══════════════════════════════════════════════════════════════
  const application = await prisma.application.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      stage: 'ENROLLED',
      programmeChoice: 'FULL_TIME_2YEAR',
      fundingType: 'SELF_FUNDED',
      intakeCycleId: intakeCycle.id,
      interviewSlotId: null,
      medicalStatus: 'CLEARED',
    },
  })
  const stageTransitions = [
    'REGISTERED',
    'PAYMENT_PENDING',
    'PAYMENT_SUBMITTED',
    'PAYMENT_VERIFIED',
    'APTITUDE_PENDING',
    'APTITUDE_COMPLETED',
    'SHORTLISTED',
    'INTERVIEW_PENDING',
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_COMPLETED',
    'SELECTED',
    'MEDICAL_PENDING',
    'MEDICAL_SUBMITTED',
    'MEDICAL_CLEARED',
    'ENROLLED',
  ]
  for (let i = 0; i < stageTransitions.length - 1; i++) {
    await prisma.applicationStageLog.create({
      data: {
        applicationId: application.id,
        fromStage: stageTransitions[i] as ApplicationStage,
        toStage: stageTransitions[i + 1] as ApplicationStage,
        actorId: superAdmin.id,
        metadata: { note: `Transition to ${stageTransitions[i + 1]}` },
        createdAt: daysFromNow(-365 + i * 25),
      },
    })
  }
  console.log('✅ Application + stage logs seeded')

  // Supporting documents
  const docTypeSlugs = [
    'id_copy',
    'passport_photo',
    'medical_cert',
    'qualification_cert',
    'passport',
  ]
  for (const slug of docTypeSlugs) {
    const docType = await prisma.applicationDocumentType.findUnique({ where: { slug } })
    if (!docType) continue
    const fileUpload = await prisma.fileUpload.create({
      data: {
        userId: student.id,
        filename: `test-${slug}.pdf`,
        originalName: `${slug}.pdf`,
        mimeType: 'application/pdf',
        size: 10240,
        url: `uploads/test/${slug}.pdf`,
        fileType: 'application',
      },
    })
    await prisma.applicationDocument.upsert({
      where: {
        applicationId_documentTypeId: { applicationId: application.id, documentTypeId: docType.id },
      },
      update: {},
      create: {
        status: 'APPROVED',
        application: { connect: { id: application.id } },
        documentType: { connect: { id: docType.id } },
        fileUpload: { connect: { id: fileUpload.id } },
      },
    })
  }
  console.log('✅ Supporting documents seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 10: Enrollments + FullTimeEnrollment
  // ══════════════════════════════════════════════════════════════
  for (const code of Object.keys(courses)) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId_semesterId: {
          userId: student.id,
          courseId: courses[code].id,
          semesterId: semester.id,
        },
      },
      update: {},
      create: {
        userId: student.id,
        courseId: courses[code].id,
        semesterId: semester.id,
        status: 'ENROLLED',
        amountPaid: 2500.0,
        academicYearId: academicYear.id,
      },
    })
  }
  await prisma.fullTimeEnrollment.upsert({
    where: { studentId_programmeId: { studentId: student.id, programmeId: ftProgramme.id } },
    update: {},
    create: {
      studentId: student.id,
      programmeId: ftProgramme.id,
      programmeYearId: progYear1.id,
      status: 'ACTIVE',
      currentYearNumber: 1,
      academicYearId: academicYear.id,
    },
  })
  console.log('✅ Enrollments seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 11: Classes
  // ══════════════════════════════════════════════════════════════
  const instructorProfile = await prisma.instructorProfile.findFirst({
    where: { userId: instructor.id },
  })
  const classData = [
    {
      name: 'M1-2025-S1',
      courseCode: 'M1',
      maxStudents: 28,
      currentStudents: 20,
      classroomId: classroomMap['CR-A'],
    },
    {
      name: 'M2-2025-S1',
      courseCode: 'M2',
      maxStudents: 28,
      currentStudents: 20,
      classroomId: classroomMap['CR-B'],
    },
    {
      name: 'M3-2025-S1',
      courseCode: 'M3',
      maxStudents: 28,
      currentStudents: 20,
      classroomId: classroomMap['CR-A'],
    },
    {
      name: 'M4-2025-S1',
      courseCode: 'M4',
      maxStudents: 28,
      currentStudents: 15,
      classroomId: classroomMap['CR-C'],
    },
    {
      name: 'M5-2025-S1',
      courseCode: 'M5',
      maxStudents: 28,
      currentStudents: 15,
      classroomId: classroomMap['CR-D'],
    },
    {
      name: 'M6-2025-S1',
      courseCode: 'M6',
      maxStudents: 28,
      currentStudents: 20,
      classroomId: classroomMap['CR-A'],
    },
    {
      name: 'M7-2025-S1',
      courseCode: 'M7',
      maxStudents: 28,
      currentStudents: 20,
      classroomId: classroomMap['CR-C'],
    },
  ]
  const classIds: Record<string, string> = {}
  for (const cd of classData) {
    const created = await prisma.class.upsert({
      where: { id: cd.name },
      update: {},
      create: {
        id: cd.name,
        name: cd.name,
        courseId: courses[cd.courseCode].id,
        instructorId: instructorProfile?.id || instructor.id,
        academicYearId: academicYear.id,
        semesterId: semester.id,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-01-30'),
        maxStudents: cd.maxStudents,
        currentStudents: cd.currentStudents,
        classroomId: cd.classroomId,
      },
    })
    classIds[cd.courseCode] = created.id
  }
  console.log('✅ Classes seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 12: ClassSessions (Historical + Current)
  // ══════════════════════════════════════════════════════════════
  const sessionData: Prisma.ClassSessionCreateManyInput[] = []
  for (const courseCode of Object.keys(courses)) {
    const classId = classIds[courseCode]
    if (!classId) continue
    for (let i = 0; i < 20; i++) {
      const date = new Date(2025, 8, 1 + i * 7)
      const startHour = i % 2 === 0 ? 9 : 13
      const scheduledStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        startHour,
        0,
        0
      )
      const scheduledEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        startHour + 3,
        0,
        0
      )
      const isPractical = courseCode === 'M4' || courseCode === 'M5' || courseCode === 'M7'
      const type =
        i < 15 ? 'THEORY' : isPractical ? 'PRACTICAL' : i === 18 ? 'REVISION' : 'ASSESSMENT'
      sessionData.push({
        classId,
        courseId: courses[courseCode].id,
        date,
        scheduledStart,
        scheduledEnd,
        actualStart: scheduledStart,
        actualEnd: scheduledEnd,
        instructorId: instructor.id,
        sessionType: type,
        instructionalHours: 3,
        topic: `${courseCode} Session ${i + 1}`,
        ataChapters: ['ATA-20', 'ATA-21'],
      })
    }
  }
  await prisma.classSession.createMany({ data: sessionData, skipDuplicates: true })
  console.log('✅ ClassSessions seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 13: Attendance Records
  // ══════════════════════════════════════════════════════════════
  const sessions = await prisma.classSession.findMany({
    where: { classId: { in: Object.values(classIds) } },
    select: { id: true, classId: true },
  })
  const attendanceData: Prisma.AttendanceRecordCreateManyInput[] = []
  for (const session of sessions) {
    const rand = Math.random()
    let status: 'PRESENT' | 'LATE' | 'ABSENT'
    if (rand < 0.85) status = 'PRESENT'
    else if (rand < 0.95) status = 'LATE'
    else status = 'ABSENT'
    attendanceData.push({
      classId: session.classId,
      userId: student.id,
      date: daysFromNow(-30),
      status,
      minutesLate: status === 'LATE' ? Math.floor(Math.random() * 10) + 5 : undefined,
      notes: status === 'ABSENT' ? 'Medical appointment' : undefined,
      recordedBy: instructor.id,
    })
  }
  await prisma.attendanceRecord.createMany({ data: attendanceData, skipDuplicates: true })
  console.log('✅ Attendance records seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 14: Grades + Practical Training
  // ══════════════════════════════════════════════════════════════
  const assessmentSessions = await prisma.classSession.findMany({
    where: { classId: { in: Object.values(classIds) }, sessionType: 'ASSESSMENT' },
    select: { id: true, classId: true, courseId: true },
  })
  for (const s of assessmentSessions) {
    const score = Math.floor(Math.random() * 20) + 75
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: student.id, courseId: s.courseId },
    })
    if (!enrollment) continue
    await prisma.grade.upsert({
      where: { id: `grade-${s.id}` },
      update: {},
      create: {
        id: `grade-${s.id}`,
        userId: student.id,
        enrollmentId: enrollment.id,
        assessmentType: 'INTERNAL_CA',
        assessmentName: `Assessment ${s.id}`,
        score: new Prisma.Decimal(score),
        maxScore: new Prisma.Decimal(100),
        percentage: new Prisma.Decimal(score),
        grade: score >= 75 ? 'PASS' : 'FAIL',
        assessmentDate: daysFromNow(-10),
        gradedBy: instructor.id,
        category: 'INTERNAL_CA',
      },
    })
  }
  console.log('✅ Grades seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 14.5: ATA Chapters
  // ══════════════════════════════════════════════════════════════
  await prisma.aTAChapter.createMany({
    data: [
      {
        id: 'ATA-30',
        code: 'ATA-30',
        title: 'Ice and Rain Protection',
        category: 'GENERAL',
        sortOrder: 30,
      },
      {
        id: 'ATA-71',
        code: 'ATA-71',
        title: 'Power Plant - General',
        category: 'POWERPLANT',
        sortOrder: 71,
      },
      {
        id: 'ATA-72',
        code: 'ATA-72',
        title: 'Turbine Engine',
        category: 'POWERPLANT',
        sortOrder: 72,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ ATA Chapters seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 15: OJT Logbook
  // ══════════════════════════════════════════════════════════════
  const ataChapters = await prisma.aTAChapter.findMany({
    where: { code: { in: ['ATA-30', 'ATA-71', 'ATA-72'] } },
    select: { id: true, code: true },
  })
  const ataMap = Object.fromEntries(ataChapters.map((c) => [c.code, c.id]))

  const ojtLogbook = await prisma.oJTLogbook.upsert({
    where: { id: `ojt-${studentProfile.id}` },
    update: {},
    create: {
      id: `ojt-${studentProfile.id}`,
      studentProfileId: studentProfile.id,
      licenceCategoryId: licB1.id,
      facilityName: 'AeroJet Maintenance Ltd',
      startDate: new Date('2025-09-01'),
      targetEndDate: new Date('2026-01-30'),
      totalLoggedHours: 320,
      status: 'ACTIVE',
    },
  })
  await prisma.oJTLogbookEntry.createMany({
    data: [
      {
        logbookId: ojtLogbook.id,
        date: new Date('2025-09-15'),
        aircraftType: 'B737',
        aircraftRegistration: '9G-AJL',
        ataChapterId: ataMap['ATA-71'],
        taskDescription: 'Engine inspection',
        workOrderReference: 'WO-001',
        maintenanceType: 'INSPECTION',
        durationHours: 8,
        supervisorId: instructor.id,
        supervisorSignature: true,
      },
      {
        logbookId: ojtLogbook.id,
        date: new Date('2025-10-15'),
        aircraftType: 'B737',
        aircraftRegistration: '9G-AJL',
        ataChapterId: ataMap['ATA-72'],
        taskDescription: 'Turbine maintenance',
        workOrderReference: 'WO-002',
        maintenanceType: 'REPAIR',
        durationHours: 8,
        supervisorId: instructor.id,
        supervisorSignature: true,
      },
      {
        logbookId: ojtLogbook.id,
        date: new Date('2025-11-15'),
        aircraftType: 'A320',
        aircraftRegistration: '9G-AKO',
        ataChapterId: ataMap['ATA-30'],
        taskDescription: 'Ice protection system check',
        workOrderReference: 'WO-003',
        maintenanceType: 'INSPECTION',
        durationHours: 8,
        supervisorId: instructor.id,
        supervisorSignature: true,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ OJT logbook seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 16: Wallet + Transactions
  // ══════════════════════════════════════════════════════════════
  const wallet = await prisma.wallet.findFirst({ where: { userId: student.id } })
  if (wallet) {
    const txnData = [
      { type: 'PAYMENT', amount: 500.0, description: 'Registration fee' },
      { type: 'PAYMENT', amount: 350.0, description: 'Registration fee' },
      { type: 'PAYMENT', amount: 2500.0, description: 'Course payment - M1' },
      { type: 'PAYMENT', amount: 2500.0, description: 'Course payment - M2' },
      { type: 'PAYMENT', amount: 2000.0, description: 'Course payment - M3' },
      { type: 'PAYMENT', amount: 3000.0, description: 'Course payment - M4' },
      { type: 'PAYMENT', amount: 3000.0, description: 'Course payment - M5' },
      { type: 'PAYMENT', amount: 1500.0, description: 'Course payment - M6' },
      { type: 'PAYMENT', amount: 1800.0, description: 'Course payment - M7' },
      { type: 'TOP_UP', amount: 15000.0, description: 'Wallet top-up TXN-2025-001' },
    ] as const
    let balanceBefore = 500000
    for (const txn of txnData) {
      const balanceAfter = balanceBefore - txn.amount
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          ...txn,
          balanceBefore,
          balanceAfter,
          availableBefore: balanceBefore,
          availableAfter: balanceAfter,
          referenceType: 'WALLET',
          referenceId: wallet.id,
        },
      })
      balanceBefore = balanceAfter
    }
  }
  console.log('✅ Wallet transactions seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 17: Internal Exam Banks + Questions
  // ══════════════════════════════════════════════════════════════
  const bankData = [
    { name: 'M1-MATH-BANK', courseCode: 'M1', moduleCode: 'M1-MATH', categoryCode: 'B1' },
    { name: 'M2-PHYS-BANK', courseCode: 'M2', moduleCode: 'M2-PHYS', categoryCode: 'B2' },
    { name: 'M3-ELEC-BANK', courseCode: 'M3', moduleCode: 'M3-ELEC', categoryCode: 'B2' },
  ]
  const bankIds: Record<string, string> = {}
  for (const bd of bankData) {
    const bank = await prisma.internalExamBank.upsert({
      where: { id: `bank-${bd.courseCode}` },
      update: {},
      create: {
        id: `bank-${bd.courseCode}`,
        courseId: courses[bd.courseCode].id,
        moduleCode: bd.moduleCode,
        name: bd.name,
        ruleSet: 'EASA',
        mcqCount: 40,
        isActive: true,
        reviewState: 'APPROVED',
        categoryCode: bd.categoryCode,
        certificateEnabled: false,
      },
    })
    bankIds[bd.courseCode] = bank.id
  }
  console.log('✅ Internal exam banks seeded')

  // Questions per bank (3 options, knowledge levels, explanations)
  const knowledgeLevels = [1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
  for (const courseCode of ['M1', 'M2', 'M3']) {
    const bankId = bankIds[courseCode]
    if (!bankId) continue
    const existingCount = await prisma.internalExamQuestion.count({ where: { bankId } })
    if (existingCount >= 40) continue
    const questions: Prisma.InternalExamQuestionCreateManyInput[] = []
    for (let i = 0; i < 40; i++) {
      const correctAnswer = `Option ${String.fromCharCode(65 + (i % 3))}`
      questions.push({
        bankId,
        text: `Sample question ${i + 1} for ${courseCode}`,
        options: [
          `Option ${String.fromCharCode(65 + (i % 3))}`,
          `Option ${String.fromCharCode(66 + (i % 3))}`,
          `Option ${String.fromCharCode(67 + (i % 3))}`,
        ],
        correctAnswer,
        points: 1,
        difficulty: 'MEDIUM' as QuestionDifficulty,
        isEssay: false,
        essayTimeMins: 20,
        isActive: true,
        status: 'APPROVED',
        knowledgeLevel: knowledgeLevels[i % knowledgeLevels.length],
        explanation: i < 5 ? `Explanation for question ${i + 1}` : null,
        sortOrder: i + 1,
        submittedById: instructor.id,
      })
    }
    await prisma.internalExamQuestion.createMany({ data: questions, skipDuplicates: true })
  }
  console.log('✅ Internal exam questions seeded')

  // Rule overrides
  for (const courseCode of ['M1', 'M2', 'M3']) {
    const bankId = bankIds[courseCode]
    if (!bankId) continue
    await prisma.internalExamRuleOverride.upsert({
      where: { bankId },
      update: {},
      create: {
        bankId,
        passMarkPct: 75,
        timePerQuestionSecs: 75,
        retakeWaitDays: 90,
        maxRetakes: 3,
        completionWindowYears: 10,
      },
    })
  }
  console.log('✅ Rule overrides seeded')

  // Bank-Instructor Assignments
  for (const courseCode of ['M1', 'M2', 'M3']) {
    const bankId = bankIds[courseCode]
    if (!bankId) continue
    if (!instructorProfile) continue
    await prisma.internalExamBankInstructor.upsert({
      where: { bankId_instructorId: { bankId, instructorId: instructorProfile.id } },
      update: {},
      create: {
        bankId,
        instructorId: instructorProfile.id,
        canEdit: true,
        canReview: true,
        canMonitor: true,
        canPublish: true,
      },
    })
  }
  console.log('✅ Bank instructor assignments seeded')

  // Class schedules
  for (const courseCode of ['M1', 'M2', 'M3']) {
    const bankId = bankIds[courseCode]
    const classId = classIds[courseCode]
    if (!bankId || !classId) continue
    await prisma.internalExamClassSchedule.upsert({
      where: { id: `schedule-${courseCode}` },
      update: {},
      create: {
        id: `schedule-${courseCode}`,
        bankId,
        classId,
        scheduledStart: new Date('2025-11-01T09:00:00Z'),
        scheduledEnd: new Date('2025-11-01T12:00:00Z'),
        isActive: true,
        allowLateStart: false,
        sebRequired: false,
      },
    })
  }
  console.log('✅ Class schedules seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 18: Internal Exam Sessions
  // ══════════════════════════════════════════════════════════════
  // Completed sessions
  const completedSessions = [
    {
      id: 'session-M1-1',
      bankCode: 'M1',
      score: 32,
      totalPoints: 40,
      percentage: 80,
      passed: true,
      attemptNumber: 1,
      startedAt: daysFromNow(-30),
      submittedAt: daysFromNow(-30 + 50 / 60 / 24),
      status: 'COMPLETED' as TestSessionStatus,
    },
    {
      id: 'session-M2-1',
      bankCode: 'M2',
      score: 30,
      totalPoints: 40,
      percentage: 75,
      passed: true,
      attemptNumber: 1,
      startedAt: daysFromNow(-15),
      submittedAt: daysFromNow(-15 + 50 / 60 / 24),
      status: 'COMPLETED' as TestSessionStatus,
    },
    {
      id: 'session-M3-fail',
      bankCode: 'M3',
      score: 29,
      totalPoints: 40,
      percentage: 72.5,
      passed: false,
      attemptNumber: 1,
      startedAt: daysFromNow(-10),
      submittedAt: daysFromNow(-10 + 50 / 60 / 24),
      status: 'COMPLETED' as TestSessionStatus,
    },
    {
      id: 'session-M1-r1',
      bankCode: 'M1',
      score: 31,
      totalPoints: 40,
      percentage: 77.5,
      passed: true,
      attemptNumber: 1,
      startedAt: daysFromNow(-100),
      submittedAt: daysFromNow(-100 + 50 / 60 / 24),
      status: 'COMPLETED' as TestSessionStatus,
    },
    {
      id: 'session-M1-r2',
      bankCode: 'M1',
      score: 34,
      totalPoints: 40,
      percentage: 85,
      passed: true,
      attemptNumber: 2,
      startedAt: daysFromNow(-5),
      submittedAt: daysFromNow(-5 + 50 / 60 / 24),
      status: 'COMPLETED' as TestSessionStatus,
    },
    {
      id: 'session-M1-timeout',
      bankCode: 'M1',
      score: null,
      totalPoints: null,
      percentage: null,
      passed: null,
      attemptNumber: 1,
      startedAt: daysFromNow(-20),
      submittedAt: null,
      status: 'TIMED_OUT' as TestSessionStatus,
      autoSubmitted: true,
    },
    {
      id: 'session-M2-void',
      bankCode: 'M2',
      score: null,
      totalPoints: null,
      percentage: null,
      passed: null,
      attemptNumber: 1,
      startedAt: daysFromNow(-18),
      submittedAt: null,
      status: 'VOIDED' as TestSessionStatus,
      voidReason: 'Technical issue',
    },
    {
      id: 'session-M3-void',
      bankCode: 'M3',
      score: null,
      totalPoints: null,
      percentage: null,
      passed: null,
      attemptNumber: 1,
      startedAt: daysFromNow(-12),
      submittedAt: null,
      status: 'VOIDED' as TestSessionStatus,
      voidReason: 'Cheating detected',
    },
    {
      id: 'session-M1-flag',
      bankCode: 'M1',
      score: null,
      totalPoints: null,
      percentage: null,
      passed: null,
      attemptNumber: 1,
      startedAt: daysFromNow(-8),
      submittedAt: null,
      status: 'FLAGGED' as TestSessionStatus,
      tabSwitchCount: 3,
    },
  ]
  for (const cs of completedSessions) {
    await prisma.internalExamSession.upsert({
      where: { id: cs.id },
      update: {},
      create: {
        id: cs.id,
        studentId: student.id,
        bankId: bankIds[cs.bankCode]!,
        classId: classIds[cs.bankCode]!,
        ruleSet: 'EASA',
        status: cs.status,
        score: cs.score,
        totalPoints: cs.totalPoints,
        percentage: cs.percentage,
        passed: cs.passed,
        attemptNumber: cs.attemptNumber,
        startedAt: cs.startedAt,
        submittedAt: cs.submittedAt,
        autoSubmitted: cs.autoSubmitted || false,
        voidReason: cs.voidReason,
        tabSwitchCount: cs.tabSwitchCount || 0,
        fullscreenExits: 0,
        keyboardEvents: 0,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        supervised: false,
        isPublished: false,
        categoryCode: cs.bankCode === 'M1' ? 'B1' : 'B2',
      },
    })
  }
  console.log('✅ Completed sessions seeded')

  // Active session (NOT_STARTED, will be transitioned to IN_PROGRESS)
  const activeSession = await prisma.internalExamSession.upsert({
    where: { id: 'session-M3-active' },
    update: {},
    create: {
      id: 'session-M3-active',
      studentId: student.id,
      bankId: bankIds['M3']!,
      classId: classIds['M3']!,
      ruleSet: 'EASA',
      status: 'NOT_STARTED',
      attemptNumber: 1,
      tabSwitchCount: 0,
      fullscreenExits: 0,
      keyboardEvents: 0,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      supervised: false,
      isPublished: false,
      categoryCode: 'B2',
    },
  })
  console.log('✅ Active session seeded')

  // Cron test sessions
  await prisma.internalExamSession.upsert({
    where: { id: 'cron-timeout' },
    update: {},
    create: {
      id: 'cron-timeout',
      studentId: student.id,
      bankId: bankIds['M1']!,
      classId: classIds['M1']!,
      ruleSet: 'EASA',
      status: 'IN_PROGRESS',
      attemptNumber: 1,
      startedAt: daysFromNow(-2),
      expiresAt: daysFromNow(-2 + 50 / 60 / 24),
      lastActivityAt: daysFromNow(-2 - 1 / 24),
      tabSwitchCount: 0,
      fullscreenExits: 0,
      keyboardEvents: 0,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      supervised: false,
      isPublished: false,
      categoryCode: 'B1',
    },
  })
  await prisma.internalExamSession.upsert({
    where: { id: 'cron-recover' },
    update: {},
    create: {
      id: 'cron-recover',
      studentId: student.id,
      bankId: bankIds['M2']!,
      classId: classIds['M2']!,
      ruleSet: 'EASA',
      status: 'IN_PROGRESS',
      attemptNumber: 1,
      startedAt: daysFromNow(-3),
      expiresAt: daysFromNow(-3 + 50 / 60 / 24),
      lastActivityAt: daysFromNow(-3 - 2 / 24),
      submittedAt: null,
      tabSwitchCount: 0,
      fullscreenExits: 0,
      keyboardEvents: 0,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      supervised: false,
      isPublished: false,
      categoryCode: 'B2',
    },
  })
  console.log('✅ Cron test sessions seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 19: Answers + Access Codes + Registrations
  // ══════════════════════════════════════════════════════════════
  // Answers for active session (5-10 answers with questionOrder)
  const m3Questions = await prisma.internalExamQuestion.findMany({
    where: { bankId: bankIds['M3']! },
    take: 10,
    select: { id: true },
  })
  const questionOrder = m3Questions.map((q) => q.id)
  const answersData = m3Questions.slice(0, 8).map((q, i) => ({
    sessionId: activeSession.id,
    questionId: q.id,
    selectedAnswer: i < 5 ? `Option ${String.fromCharCode(65 + (i % 3))}` : null,
    isCorrect: i < 5 ? true : null,
    pointsAwarded: i < 5 ? 1 : 0,
    answeredAt: daysFromNow(-1 + (i * 5) / 60 / 24),
  }))
  await prisma.internalExamAnswer.createMany({ data: answersData, skipDuplicates: true })
  await prisma.internalExamSession.update({
    where: { id: activeSession.id },
    data: { questionOrder: JSON.stringify(questionOrder) },
  })

  // Answers for completed and timed-out sessions, so staff review and the
  // instructor monitor have realistic per-question data on first load.
  const completedAnswerSessions = completedSessions.filter(
    (session) => session.status === 'COMPLETED' || session.status === 'TIMED_OUT'
  )
  const completedAnswerQuestions = await Promise.all(
    completedAnswerSessions.map(async (session) => {
      const questions = await prisma.internalExamQuestion.findMany({
        where: { bankId: bankIds[session.bankCode]! },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, correctAnswer: true },
      })
      return { session, questions }
    })
  )
  const completedAnswersData: Prisma.InternalExamAnswerCreateManyInput[] = []
  for (const { session, questions } of completedAnswerQuestions) {
    const paper = session.status === 'TIMED_OUT' ? questions.slice(0, 10) : questions
    const correctCount =
      session.status === 'COMPLETED'
        ? Math.min(session.score ?? 0, paper.length)
        : Math.min(5, paper.length)

    for (const [index, question] of paper.entries()) {
      const isCorrect = index < correctCount
      completedAnswersData.push({
        sessionId: session.id,
        questionId: question.id,
        selectedAnswer: isCorrect
          ? question.correctAnswer
          : `Option ${String.fromCharCode(65 + ((index + 1) % 3))}`,
        isCorrect,
        pointsAwarded: isCorrect ? 1 : 0,
        answeredAt: session.submittedAt || session.startedAt || NOW,
      })
    }

    await prisma.internalExamSession.update({
      where: { id: session.id },
      data: { questionOrder: JSON.stringify(paper.map((question) => question.id)) },
    })
  }
  await prisma.internalExamAnswer.createMany({ data: completedAnswersData, skipDuplicates: true })
  console.log('✅ Answers seeded')

  // Access codes
  for (const session of completedSessions) {
    await prisma.internalExamAccessCode.upsert({
      where: { id: `code-${session.id}` },
      update: {},
      create: {
        id: `code-${session.id}`,
        sessionId: session.id,
        code: crypto.randomBytes(6).toString('hex').toUpperCase(),
        used: true,
        expiresAt: session.submittedAt || daysFromNow(-1),
      },
    })
  }
  await prisma.internalExamAccessCode.upsert({
    where: { id: `code-${activeSession.id}` },
    update: {},
    create: {
      id: `code-${activeSession.id}`,
      sessionId: activeSession.id,
      code: crypto.randomBytes(6).toString('hex').toUpperCase(),
      used: false,
      expiresAt: daysFromNow(7),
    },
  })
  console.log('✅ Access codes seeded')

  // Registrations
  await prisma.internalExamRegistration.upsert({
    where: { id: `reg-${activeSession.id}` },
    update: {},
    create: {
      id: `reg-${activeSession.id}`,
      sessionId: activeSession.id,
      userId: student.id,
      fullName: 'Kwame Student',
      dateOfBirth: new Date('2000-01-01'),
      nationality: 'Ghanaian',
      email: student.email,
      phone: '+233200000030',
      licenceCategory: 'B2',
      licenceCategoryId: licB2.id,
      examDate: daysFromNow(7),
      examLocation: 'Accra',
      status: 'PENDING',
      modules: ['M3-ELEC'],
    },
  })
  console.log('✅ Registrations seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 20: InternalExamViolation + InternalExamReport
  // ══════════════════════════════════════════════════════════════
  const flagSession = completedSessions.find((s) => s.status === 'FLAGGED')
  if (flagSession) {
    await prisma.internalExamViolation.upsert({
      where: { id: `violation-${flagSession.id}` },
      update: {},
      create: {
        id: `violation-${flagSession.id}`,
        sessionId: flagSession.id,
        studentId: student.id,
        classId: classIds['M1']!,
        bankId: bankIds['M1']!,
        type: 'TAB_SWITCH',
        severity: 'WARNING',
        detail: '3 tab switches detected during exam session',
        deviceInfo: { userAgent: 'test-agent', timestamp: new Date().toISOString() },
        reviewed: false,
      },
    })
  }
  const completedSession = completedSessions.find(
    (s) => s.status === 'COMPLETED' && s.bankCode === 'M2'
  )
  if (completedSession) {
    const q = await prisma.internalExamQuestion.findFirst({ where: { bankId: bankIds['M2']! } })
    if (q) {
      await prisma.internalExamReport.upsert({
        where: { id: `report-${completedSession.id}` },
        update: {},
        create: {
          id: `report-${completedSession.id}`,
          sessionId: completedSession.id,
          studentId: student.id,
          status: 'PENDING',
          reason: 'Question 23 appears to have two correct answers',
          questionId: q.id,
        },
      })
    }
  }
  console.log('✅ Violations and reports seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 21: Certificates
  // ══════════════════════════════════════════════════════════════
  for (const cs of completedSessions.filter((s) => s.passed)) {
    await prisma.certificate.upsert({
      where: { id: `cert-${cs.id}` },
      update: {},
      create: {
        id: `cert-${cs.id}`,
        certificateId: `CERT-${cs.bankCode}-2025-${cs.id.slice(-3)}`,
        sessionId: cs.id,
        studentId: student.id,
        courseId: courses[cs.bankCode].id,
        moduleCode: bankData.find((b) => b.courseCode === cs.bankCode)?.moduleCode || cs.bankCode,
        score: cs.score || 0,
        percentage: cs.percentage || 0,
        template: 'internal_exam',
        pdfUrl: 'placeholder',
        issuedAt: cs.submittedAt || daysFromNow(-1),
        issuedBy: instructor.id,
        verified: true,
      },
    })
  }
  console.log('✅ Certificates seeded')

  // ══════════════════════════════════════════════════════════════
  // STEP 22: Audit logs
  // ══════════════════════════════════════════════════════════════
  await prisma.auditLog.createMany({
    data: [
      {
        action: 'USER_ENROLLED',
        userId: superAdmin.id,
        entity: 'User',
        entityId: student.id,
        description: 'Student enrolled in Full-Time 2-Year B1/B2',
        changes: { before: {}, after: { enrollmentStatus: 'ENROLLED' } },
      },
      {
        action: 'CLASS_ASSIGNED',
        userId: superAdmin.id,
        entity: 'User',
        entityId: student.id,
        description: 'Student assigned to classes M1-M7',
        changes: { before: {}, after: { classes: Object.keys(classIds) } },
      },
      {
        action: 'EXAM_BANK_INSTRUCTOR_ASSIGNED',
        userId: superAdmin.id,
        entity: 'User',
        entityId: instructor.id,
        description: 'Instructor assigned to exam banks M1, M2, M3',
        changes: { before: {}, after: { banks: Object.keys(bankIds) } },
      },
      {
        action: 'EXAM_SCHEDULE_CREATED',
        userId: superAdmin.id,
        entity: 'InternalExamClassSchedule',
        entityId: Object.values(classIds).join(','),
        description: 'Exam schedules created for M1, M2, M3',
        changes: { before: {}, after: { schedules: Object.keys(bankIds) } },
      },
      {
        action: 'SESSION_STATUS_CHANGED',
        userId: instructor.id,
        entity: 'User',
        entityId: student.id,
        description: 'Session M1-SESSION-1 completed',
        changes: { before: { status: 'IN_PROGRESS' }, after: { status: 'COMPLETED' } },
      },
      {
        action: 'EXAM_RESULT_PUBLISHED',
        userId: instructor.id,
        entity: 'User',
        entityId: student.id,
        description: 'Results published for M1, M2',
        changes: { before: {}, after: { published: true } },
      },
      {
        action: 'CERTIFICATE_ISSUED',
        userId: instructor.id,
        entity: 'User',
        entityId: student.id,
        description: 'Certificates issued for M1, M2',
        changes: { before: {}, after: { certificates: 2 } },
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Audit logs seeded')

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
