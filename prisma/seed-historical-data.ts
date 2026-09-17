import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  console.log('🌱 Correcting academic data seeding with pathway alignment...')

  // 1. Reference Data
  const programmes = await prisma.fullTimeProgramme.findMany()
  const _progMap = Object.fromEntries(programmes.map(p => [p.code, p.id]))
  
  const courses = await prisma.course.findMany()
  const courseMap = Object.fromEntries(courses.map(c => [c.code, c.id]))

  const instructor = await prisma.instructorProfile.findFirst()
  const instructorId = instructor?.id || null

  // 2. Academic Years & Semesters
  const pastYear = await prisma.academicYear.upsert({
    where: { name: '2024/2025' },
    update: { isActive: false },
    create: {
      name: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: false
    }
  })

  const currentYear = await prisma.academicYear.upsert({
    where: { name: '2025/2026' },
    update: { isActive: true },
    create: {
      name: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true
    }
  })

  const pastSem1 = await prisma.semester.upsert({
    where: { id: 'past-sem-1' },
    update: {},
    create: {
      id: 'past-sem-1',
      name: 'Semester 1',
      academicYearId: pastYear.id,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-01-31'),
      isActive: false
    }
  })

  const currentSem1 = await prisma.semester.upsert({
    where: { id: 'current-sem-1' },
    update: {},
    create: {
      id: 'current-sem-1',
      name: 'Semester 1',
      academicYearId: currentYear.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-31'),
      isActive: true
    }
  })

  // 3. Define Cohorts and their Pathways
  const cohorts = [
    { code: 'FT4Y', progCode: 'FT_4Y_B1B2', students: ['test1@test.com', 'test2@test.com', 'test7@test.com', 'test8@test.com'] },
    { code: 'FT2Y', progCode: 'FT_2Y_B1', students: ['test3@test.com'] },
    { code: 'MIL1Y', progCode: 'MIL_1Y_B1', students: ['test4@test.com'] },
    { code: 'MOD', progCode: null, students: ['test5@test.com', 'test9@test.com'] },
    { code: 'EXAM', progCode: null, students: ['test6@test.com', 'test10@test.com'] }
  ]

  console.log('⏳ Processing cohorts...')

  for (const cohort of cohorts) {
    const users = await prisma.user.findMany({
      where: { email: { in: cohort.students } }
    })

    if (users.length === 0) continue

    // A. Historical (Past Year) - M1, M2
    const pastModules = ['M1', 'M2']
    for (const modCode of pastModules) {
      const courseId = courseMap[modCode]
      if (!courseId) continue

      const classId = `past-${cohort.code}-${modCode}`
      const pastClass = await prisma.class.upsert({
        where: { id: classId },
        update: { name: `${modCode} - ${cohort.code} - Fall 2024` },
        create: {
          id: classId,
          name: `${modCode} - ${cohort.code} - Fall 2024`,
          courseId,
          academicYearId: pastYear.id,
          semesterId: pastSem1.id,
          startDate: new Date('2024-09-15'),
          endDate: new Date('2024-12-15'),
          instructorId
        }
      })

      for (const user of users) {
        // Enrollment
        const enrollment = await prisma.enrollment.upsert({
          where: { userId_courseId_semesterId: { userId: user.id, courseId, semesterId: pastSem1.id } },
          update: { status: 'GRADUATED' },
          create: {
            userId: user.id,
            courseId,
            academicYearId: pastYear.id,
            semesterId: pastSem1.id,
            status: 'GRADUATED',
            enrolledAt: new Date('2024-09-01')
          }
        })

        // Attendance
        await prisma.attendanceRecord.deleteMany({ where: { classId: pastClass.id, userId: user.id } })
        await prisma.attendanceRecord.createMany({
          data: [
            { classId: pastClass.id, userId: user.id, date: new Date('2024-10-01'), status: 'PRESENT' },
            { classId: pastClass.id, userId: user.id, date: new Date('2024-10-08'), status: Math.random() > 0.1 ? 'PRESENT' : 'ABSENT' },
          ]
        })

        // Grades
        const score = 80 + Math.floor(Math.random() * 15)
        await prisma.grade.upsert({
          where: { id: `grade-${user.id}-${modCode}` },
          update: { score, percentage: score },
          create: {
            id: `grade-${user.id}-${modCode}`,
            userId: user.id,
            enrollmentId: enrollment.id,
            assessmentType: 'EXAM',
            assessmentName: 'Final Exam',
            score: score,
            maxScore: 100,
            percentage: score,
            grade: 'P',
            assessmentDate: new Date('2024-12-20')
          }
        })
      }
    }

    // B. Current (Present Year) - M3, M4
    const currentModules = ['M3', 'M4']
    for (const modCode of currentModules) {
      const courseId = courseMap[modCode]
      if (!courseId) continue

      const classId = `curr-${cohort.code}-${modCode}`
      const currClass = await prisma.class.upsert({
        where: { id: classId },
        update: { name: `${modCode} - ${cohort.code} - Fall 2025` },
        create: {
          id: classId,
          name: `${modCode} - ${cohort.code} - Fall 2025`,
          courseId,
          academicYearId: currentYear.id,
          semesterId: currentSem1.id,
          startDate: new Date('2025-09-15'),
          endDate: new Date('2025-12-15'),
          instructorId
        }
      })

      for (const user of users) {
        // Enrollment
        await prisma.enrollment.upsert({
          where: { userId_courseId_semesterId: { userId: user.id, courseId, semesterId: currentSem1.id } },
          update: { status: 'ACTIVE' },
          create: {
            userId: user.id,
            courseId,
            academicYearId: currentYear.id,
            semesterId: currentSem1.id,
            status: 'ACTIVE',
            enrolledAt: new Date('2025-09-01')
          }
        })

        // Attendance
        await prisma.attendanceRecord.upsert({
          where: { classId_userId_date: { classId: currClass.id, userId: user.id, date: new Date('2025-10-01') } },
          update: { status: 'PRESENT' },
          create: { classId: currClass.id, userId: user.id, date: new Date('2025-10-01'), status: 'PRESENT' }
        })

        // Update Student Profile mapping
        await prisma.studentProfile.update({
          where: { userId: user.id },
          data: {
            academicYearId: currentYear.id,
            semesterId: currentSem1.id
          }
        })
      }
    }
  }

  // 4. Sync Student Counts
  console.log('🔄 Syncing final student counts...')
  const allClasses = await prisma.class.findMany({
    include: { attendanceRecords: { select: { userId: true }, distinct: ['userId'] } }
  })
  for (const c of allClasses) {
    await prisma.class.update({
      where: { id: c.id },
      data: { currentStudents: c.attendanceRecords.length }
    })
  }

  console.log('✨ Pathway-aligned seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
