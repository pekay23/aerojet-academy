import prisma from '../lib/prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================================================================
  // 1. SYSTEM USERS
  // ============================================================================

  // Create Super Admin
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2026', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aerojet-academy.com' },
    update: {},
    create: {
      email: 'admin@aerojet-academy.com',
      academyEmail: 'admin@aerojet-academy.com',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          phone: '+233200000000',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
    },
  })
  console.log(`✅ Super Admin: ${admin.email}`)

  // Create Staff user
  const staffPassword = await bcrypt.hash('Staff@2026', 12)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@aerojet-academy.com' },
    update: {},
    create: {
      email: 'staff@aerojet-academy.com',
      academyEmail: 'staff@aerojet-academy.com',
      password: staffPassword,
      role: 'STAFF',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Staff',
          phone: '+233200000001',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      staffProfile: {
        create: {
          employeeId: 'STAFF-001',
          department: 'Academic Affairs',
        },
      },
    },
  })
  console.log(`✅ Staff: ${staff.email}`)

  // Create Instructor
  const instructorPassword = await bcrypt.hash('Instructor@2026', 12)
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@aerojet-academy.com' },
    update: {},
    create: {
      email: 'instructor@aerojet-academy.com',
      academyEmail: 'instructor@aerojet-academy.com',
      password: instructorPassword,
      role: 'INSTRUCTOR',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Captain',
          lastName: 'Mensah',
          phone: '+233200000002',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      instructorProfile: {
        create: {
          employeeId: 'EMP-001',
          specialization: 'B1 Mechanical',
          qualifications: 'EASA-GH-2024-001',
        },
      },
    },
  })
  console.log(`✅ Instructor: ${instructor.email}`)

  // ============================================================================
  // 2. COURSE CATEGORIES
  // ============================================================================
  const coreCategory = await prisma.courseCategory.upsert({
    where: { name: 'Core Modules' },
    update: {},
    create: {
      name: 'Core Modules',
      description: 'Mandatory foundational modules (M1-M10)',
    },
  })

  const specialistCategory = await prisma.courseCategory.upsert({
    where: { name: 'Specialist Modules' },
    update: {},
    create: {
      name: 'Specialist Modules',
      description: 'Category-specific mechanical and turbine modules',
    },
  })

  const avionicsCategory = await prisma.courseCategory.upsert({
    where: { name: 'Avionics Modules' },
    update: {},
    create: {
      name: 'Avionics Modules',
      description: 'Electronic and systems modules (M13-M14)',
    },
  })
  console.log('✅ Course Categories seeded')

  // ============================================================================
  // 3. LICENSE CATEGORIES
  // ============================================================================
  const licenses = [
    { code: 'B1.1', name: 'Aeroplanes Turbine – Mechanical' },
    { code: 'B1.2', name: 'Aeroplanes Piston – Mechanical' },
    { code: 'B1.3', name: 'Helicopters Turbine – Mechanical' },
    { code: 'B1.4', name: 'Helicopters Piston - Mechanical' },
    { code: 'B2', name: 'Avionics' },
  ]

  const createdLicenses: Record<string, any> = {}
  for (const lic of licenses) {
    createdLicenses[lic.code] = await prisma.licenseCategory.upsert({
      where: { code: lic.code },
      update: {},
      create: lic,
    })
  }
  console.log('✅ License Categories seeded')

  // ============================================================================
  // 4. STUDY PATHWAYS
  // ============================================================================
  const pathways = [
    {
      code: 'FULL_TIME_4Y',
      name: '4-Year Full-Time (Theory + OJT)',
      requiresAutoEnrollment: true,
      grantsTuitionAccess: true,
      includesOjt: true,
      description: 'Comprehensive Theory + OJT',
    },
    {
      code: 'FULL_TIME_2Y',
      name: '2-Year Full-Time (Theory Only)',
      requiresAutoEnrollment: true,
      grantsTuitionAccess: true,
      includesOjt: false,
      description: 'Theoretical training only',
    },
    {
      code: 'MILITARY_1Y',
      name: '1-Year Military Certification',
      requiresAutoEnrollment: true,
      grantsTuitionAccess: true,
      includesOjt: false,
      description: 'Accelerated for experienced personnel',
    },
    {
      code: 'MODULAR',
      name: 'Modular Route',
      requiresAutoEnrollment: false,
      grantsTuitionAccess: true,
      includesOjt: false,
      description: 'A la carte module booking',
    },
    {
      code: 'EXAM_ONLY',
      name: 'Exam-Only Route',
      requiresAutoEnrollment: false,
      grantsTuitionAccess: false,
      includesOjt: false,
      description: 'Self-study, exams only',
    },
  ]

  const createdPathways: Record<string, any> = {}
  for (const p of pathways) {
    createdPathways[p.code] = await prisma.studyPathwayModel.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    })
  }
  console.log('✅ Study Pathways seeded')

  // ============================================================================
  // 5. EASA MODULES (COURSES)
  // ============================================================================
  const moduleData = [
    { code: 'M1',  name: 'Mathematics',                                        duration: 20, price: 1190.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M2',  name: 'Physics',                                             duration: 20, price: 1190.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M3',  name: 'Basic Electricals',                                   duration: 24, price: 1400.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M4',  name: 'Basic Electronics',                                   duration: 20, price: 1190.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M5',  name: 'Digital Techniques',                                  duration: 24, price: 1400.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M6',  name: 'Materials & Hardware',                                duration: 25, price: 1400.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M7',  name: 'Maintenance Practices',                               duration: 15, price: 1030.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M8',  name: 'Basic Aerodynamics',                                  duration: 15, price: 1030.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M9',  name: 'Human Factors',                                       duration: 15, price: 1030.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M10', name: 'Aviation Legislation',                                duration: 15, price: 1030.0, categoryId: coreCategory.id,      moduleType: 'CORE' as const },
    { code: 'M11', name: 'Turbine Aeroplane Aerodynamics & Systems',            duration: 25, price: 1400.0, categoryId: specialistCategory.id, moduleType: 'SPECIALIST' as const },
    { code: 'M12', name: 'Helicopter Aerodynamics, Structures & Systems',       duration: 25, price: 1400.0, categoryId: specialistCategory.id, moduleType: 'SPECIALIST' as const },
    { code: 'M13', name: 'Aircraft Aerodynamics, Structures & Systems (Avionics)', duration: 25, price: 1400.0, categoryId: avionicsCategory.id,  moduleType: 'AVIONICS' as const },
    { code: 'M14', name: 'Propulsion',                                          duration: 15, price: 1090.0, categoryId: avionicsCategory.id,  moduleType: 'AVIONICS' as const },
    { code: 'M15', name: 'Turbine Engines',                                     duration: 25, price: 1400.0, categoryId: specialistCategory.id, moduleType: 'SPECIALIST' as const },
    { code: 'M16', name: 'Piston Engine',                                       duration: 25, price: 1400.0, categoryId: specialistCategory.id, moduleType: 'SPECIALIST' as const },
    { code: 'M17', name: 'Propellers',                                          duration: 15, price: 1090.0, categoryId: specialistCategory.id, moduleType: 'SPECIALIST' as const },
  ]

  const createdModules: Record<string, any> = {}
  for (const mod of moduleData) {
    createdModules[mod.code] = await prisma.course.upsert({
      where: { code: mod.code },
      update: {
        name: mod.name,
        duration: mod.duration,
        price: mod.price,
        categoryId: mod.categoryId,
        moduleType: mod.moduleType,
        isActive: true,
      },
      create: {
        code: mod.code,
        name: mod.name,
        duration: mod.duration,
        price: mod.price,
        categoryId: mod.categoryId,
        moduleType: mod.moduleType,
        isActive: true,
      },
    })
  }
  console.log(`✅ ${moduleData.length} EASA Modules seeded`)

  // ============================================================================
  // 6. EXAM COMPONENTS (Handling A/B Splits)
  // ============================================================================
  console.log('📝 Seeding Exam Components...')
  for (const mod of moduleData) {
    // Standard MCQ for every module (€520 individual / €300 pool)
    await prisma.examComponent.upsert({
      where: { code: `${mod.code}_MCQ` },
      update: {
        individualPrice: 520.0,
        poolPrice: 300.0,
      },
      create: {
        courseId: createdModules[mod.code].id,
        code: `${mod.code}_MCQ`,
        name: `${mod.code} Multiple Choice Exam`,
        type: 'MCQ',
        duration: 90,
        individualPrice: 520.0,
        poolPrice: 300.0,
      },
    })

    // Create the independent MP Essay specifically for M7/M9/M10
    if (['M7', 'M9', 'M10'].includes(mod.code)) {
      await prisma.examComponent.upsert({
        where: { code: `${mod.code}_ESSAY` },
        update: {
          individualPrice: 340.0,
          poolPrice: 340.0,
        },
        create: {
          courseId: createdModules[mod.code].id,
          code: `${mod.code}_ESSAY`,
          name: `${mod.code} Essay Exam`,
          type: 'ESSAY',
          duration: 40,
          individualPrice: 340.0, // Specific MP Essay modular price
          poolPrice: 340.0,
        },
      })
    }
  }

  // ============================================================================
  // 7. LICENSE MODULE REQUIREMENTS (Overlap Logic)
  // ============================================================================
  console.log('🔗 Mapping modules to licenses...')
  const requirementsMap: Record<string, string[]> = {
    'B1.1': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M15', 'M17'],
    'B1.2': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M16', 'M17'],
    'B1.3': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M12', 'M15'],
    'B1.4': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M12', 'M16'],
    B2: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M13', 'M14'],
  }

  for (const [licenseCode, requiredModules] of Object.entries(requirementsMap)) {
    const licenseId = createdLicenses[licenseCode].id

    for (const modCode of requiredModules) {
      const courseId = createdModules[modCode].id

      await prisma.licenseModuleRequirement.upsert({
        where: {
          licenseCategoryId_courseId: {
            licenseCategoryId: licenseId,
            courseId: courseId,
          },
        },
        update: {},
        create: {
          licenseCategoryId: licenseId,
          courseId: courseId,
        },
      })
    }
  }

  // ============================================================================
  // 8. FULL-TIME PROGRAMMES
  // ============================================================================
  const programmes = [
    {
      code: 'FT_4Y_B1B2',
      name: 'Four-Year Full-Time B1.1 & B2 Licence Programme',
      durationYears: 4,
      totalFee: 13500.0, // Per year
      description: 'Comprehensive theory, advanced hand-skills, structured work-experience.',
    },
    {
      code: 'FT_2Y_B1',
      name: 'Two-Year Full-Time B1.1 Licence Programme',
      durationYears: 2,
      totalFee: 11250.0, // Per year
      description: 'Theory + hand-skills, learning materials, PPE.',
    },
    {
      code: 'MIL_1Y_B1',
      name: '12-Month B1.1 Engineer Certification',
      durationYears: 1,
      totalFee: 9540.0, // Total
      description:
        'B1.1 theory + EASA exams (no hand-skills). Scheduled for working professionals.',
    },
  ]

  for (const prog of programmes) {
    await prisma.fullTimeProgramme.upsert({
      where: { code: prog.code },
      update: prog,
      create: {
        code: prog.code,
        name: prog.name,
        durationYears: prog.durationYears,
        totalFee: prog.totalFee,
        description: prog.description,
        isActive: true,
      },
    })
  }
  console.log('✅ Full-Time Programmes seeded')

  // ============================================================================
  // 9. ACADEMIC YEAR & SEMESTERS (2026/2027)
  // ============================================================================
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2026/2027' },
    update: {},
    create: {
      name: '2026/2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isActive: true,
    },
  })

  const semester1 = await prisma.semester.upsert({
    where: { id: (await prisma.semester.findFirst({ where: { academicYearId: academicYear.id, name: 'Semester 1' } }))?.id ?? 'nonexistent' },
    update: {},
    create: {
      name: 'Semester 1',
      academicYearId: academicYear.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-01-31'),
      isActive: true,
    },
  })

  const semester2 = await prisma.semester.upsert({
    where: { id: (await prisma.semester.findFirst({ where: { academicYearId: academicYear.id, name: 'Semester 2' } }))?.id ?? 'nonexistent-2' },
    update: {},
    create: {
      name: 'Semester 2',
      academicYearId: academicYear.id,
      startDate: new Date('2027-02-01'),
      endDate: new Date('2027-06-30'),
      isActive: false,
    },
  })
  console.log('✅ Academic Year 2026/2027 and Semesters seeded')

  // ============================================================================
  // 10. PROGRAMME YEARS
  // ============================================================================
  // Fetch programmes by code (already upserted above)
  const prog4Y = await prisma.fullTimeProgramme.findUnique({ where: { code: 'FT_4Y_B1B2' } })
  const prog2Y = await prisma.fullTimeProgramme.findUnique({ where: { code: 'FT_2Y_B1' } })
  const prog1Y = await prisma.fullTimeProgramme.findUnique({ where: { code: 'MIL_1Y_B1' } })

  if (prog4Y) {
    const years4Y = [
      { yearNumber: 1, yearFeeAmount: 13500, seatConfirmationFee: 5400, firstPaymentAmount: 4050, sem1: '2026-09-01', sem2: '2027-02-01' },
      { yearNumber: 2, yearFeeAmount: 13500, seatConfirmationFee: 6750, firstPaymentAmount: 6750, sem1: '2027-09-01', sem2: '2028-02-01' },
      { yearNumber: 3, yearFeeAmount: 13500, seatConfirmationFee: 6750, firstPaymentAmount: 6750, sem1: '2028-09-01', sem2: '2029-02-01' },
      { yearNumber: 4, yearFeeAmount: 13500, seatConfirmationFee: 6750, firstPaymentAmount: 6750, sem1: '2029-09-01', sem2: '2030-02-01' },
    ]
    for (const y of years4Y) {
      await prisma.programmeYear.upsert({
        where: { programmeId_yearNumber: { programmeId: prog4Y.id, yearNumber: y.yearNumber } },
        update: { yearFeeAmount: y.yearFeeAmount, seatConfirmationFee: y.seatConfirmationFee, firstPaymentAmount: y.firstPaymentAmount },
        create: {
          programmeId: prog4Y.id,
          yearNumber: y.yearNumber,
          yearFeeAmount: y.yearFeeAmount,
          seatConfirmationFee: y.seatConfirmationFee,
          firstPaymentAmount: y.firstPaymentAmount,
          semester1StartDate: new Date(y.sem1),
          semester2StartDate: new Date(y.sem2),
          isActive: true,
        },
      })
    }
  }

  if (prog2Y) {
    const years2Y = [
      { yearNumber: 1, yearFeeAmount: 11250, seatConfirmationFee: 4500, firstPaymentAmount: 3375, sem1: '2026-09-01', sem2: '2027-02-01' },
      { yearNumber: 2, yearFeeAmount: 11250, seatConfirmationFee: 5625, firstPaymentAmount: 5625, sem1: '2027-09-01', sem2: '2028-02-01' },
    ]
    for (const y of years2Y) {
      await prisma.programmeYear.upsert({
        where: { programmeId_yearNumber: { programmeId: prog2Y.id, yearNumber: y.yearNumber } },
        update: { yearFeeAmount: y.yearFeeAmount, seatConfirmationFee: y.seatConfirmationFee, firstPaymentAmount: y.firstPaymentAmount },
        create: {
          programmeId: prog2Y.id,
          yearNumber: y.yearNumber,
          yearFeeAmount: y.yearFeeAmount,
          seatConfirmationFee: y.seatConfirmationFee,
          firstPaymentAmount: y.firstPaymentAmount,
          semester1StartDate: new Date(y.sem1),
          semester2StartDate: new Date(y.sem2),
          isActive: true,
        },
      })
    }
  }

  if (prog1Y) {
    await prisma.programmeYear.upsert({
      where: { programmeId_yearNumber: { programmeId: prog1Y.id, yearNumber: 1 } },
      update: { yearFeeAmount: 9540 },
      create: {
        programmeId: prog1Y.id,
        yearNumber: 1,
        yearFeeAmount: 9540,
        seatConfirmationFee: 3816,
        firstPaymentAmount: 2862,
        semester1StartDate: new Date('2026-09-01'),
        semester2StartDate: new Date('2027-02-01'),
        isActive: true,
      },
    })
  }
  console.log('✅ Programme Years seeded')

  // ============================================================================
  // 11. ACADEMIC TERMS + MODULE ASSIGNMENTS PER PATHWAY
  // ============================================================================
  // Helper: upsert an AcademicTerm and assign modules to it
  async function seedTerm(
    pathwayCode: string,
    yearNumber: number,
    semesterNumber: number,
    moduleCodes: string[]
  ) {
    const pathway = createdPathways[pathwayCode]
    if (!pathway) return

    // Find or create the term
    let term = await prisma.academicTerm.findFirst({
      where: { pathwayId: pathway.id, yearNumber, semesterNumber },
    })
    if (!term) {
      term = await prisma.academicTerm.create({
        data: { pathwayId: pathway.id, yearNumber, semesterNumber },
      })
    }

    // Assign modules
    for (const code of moduleCodes) {
      const course = createdModules[code]
      if (!course) continue
      await prisma.termCourseAssignment.upsert({
        where: { termId_courseId: { termId: term.id, courseId: course.id } },
        update: {},
        create: { termId: term.id, courseId: course.id },
      })
    }
  }

  // 4-Year B1.1/B2 Pathway
  // Y1-S1: Foundational science (M1-M4)
  await seedTerm('FULL_TIME_4Y', 1, 1, ['M1', 'M2', 'M3', 'M4'])
  // Y1-S2: Applied science (M5-M8)
  await seedTerm('FULL_TIME_4Y', 1, 2, ['M5', 'M6', 'M7', 'M8'])
  // Y2-S1: Human/Legal + Specialist intro (M9, M10, M11, M13)
  await seedTerm('FULL_TIME_4Y', 2, 1, ['M9', 'M10', 'M11', 'M13'])
  // Y2-S2: Advanced specialist (M14, M15, M17 — dedup filters to student's license)
  await seedTerm('FULL_TIME_4Y', 2, 2, ['M12', 'M14', 'M15', 'M16', 'M17'])
  // Y3 & Y4 are OJT — no module assignments

  // 2-Year B1.1 Pathway
  await seedTerm('FULL_TIME_2Y', 1, 1, ['M1', 'M2', 'M3', 'M4', 'M5'])
  await seedTerm('FULL_TIME_2Y', 1, 2, ['M6', 'M7', 'M8', 'M9', 'M10'])
  await seedTerm('FULL_TIME_2Y', 2, 1, ['M11', 'M13', 'M15', 'M14'])
  await seedTerm('FULL_TIME_2Y', 2, 2, ['M12', 'M16', 'M17'])

  // Military 1-Year Pathway
  await seedTerm('MILITARY_1Y', 1, 1, ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'])
  await seedTerm('MILITARY_1Y', 1, 2, ['M8', 'M9', 'M10', 'M11', 'M13', 'M15'])

  console.log('✅ Academic Terms and Module Assignments seeded')

  // ============================================================================
  // 13. SYSTEM SETTINGS
  // ============================================================================
  const settings = [
    {
      key: 'academy_name',
      value: 'Aerojet Aviation Training Academy',
      type: 'STRING',
      description: 'general',
    },
    {
      key: 'academy_email',
      value: 'info@aerojet-academy.com',
      type: 'STRING',
      description: 'general',
    },
    { key: 'academy_phone', value: '+233 30 123 4567', type: 'STRING', description: 'general' },
    { key: 'bank_name', value: 'FNB Bank', type: 'STRING', description: 'bank' },
    { key: 'bank_account_name', value: 'AEROJET FOUNDATION', type: 'STRING', description: 'bank' },
    { key: 'bank_account_number', value: '1020003980687', type: 'STRING', description: 'bank' },
    { key: 'bank_swift', value: 'FIRNGHACXXX', type: 'STRING', description: 'bank' },
    { key: 'registration_open', value: 'true', type: 'BOOLEAN', description: 'registration' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('✅ System Settings seeded')

  // ============================================================================
  // 10. DEMO STUDENT & APPLICANT
  // ============================================================================
  const studentPassword = await bcrypt.hash('Student@2026', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@aerojet-academy.com' },
    update: {},
    create: {
      email: 'student@aerojet-academy.com',
      academyEmail: 'k.owusu@aerojet-academy.com',
      password: studentPassword,
      role: 'STUDENT',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Kwame',
          lastName: 'Owusu',
          phone: '+233200000003',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      studentProfile: {
        create: {
          studentId: 'AJA-2026-0001',
          enrollmentType: 'FULL_TIME',
          enrollmentStatus: 'ENROLLED',
          enrollmentDate: new Date(),
          pathwayId: createdPathways['FULL_TIME_4Y'].id,
        },
      },
      wallet: {
        create: {
          balance: 0,
          reservedBalance: 0,
          availableBalance: 0,
          currency: 'EUR',
        },
      },
    },
  })
  console.log(`✅ Student: ${student.email}`)

  const applicantPassword = await bcrypt.hash('Applicant@2026', 12)
  const applicant = await prisma.user.upsert({
    where: { email: 'applicant@example.com' },
    update: {},
    create: {
      email: 'applicant@example.com',
      password: applicantPassword,
      role: 'APPLICANT',
      status: 'PENDING',
      registrationCode: 'AERO-2026-DEMO01',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Ama',
          lastName: 'Adjei',
          phone: '+233200000004',
          nationality: 'Ghanaian',
          country: 'Ghana',
        },
      },
    },
  })
  console.log(`✅ Applicant: ${applicant.email}`)

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
