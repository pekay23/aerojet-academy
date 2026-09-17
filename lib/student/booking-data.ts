import { prismaUnfiltered } from '@/lib/prisma/client'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import { filterForStudentTargets, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'

export async function getBookingData(userId: string) {
  const [wallet, pricing, openEvents, upcomingExams, examComponents] = await Promise.all([
    prismaUnfiltered.wallet.findUnique({ where: { userId } }),
    getExamPricingConfig(),
    prismaUnfiltered.examEvent.findMany({
      where: {
        status: { in: ['OPEN', 'DRAFT'] },
        joinDeadline: { gt: new Date() },
      },
      select: { id: true, name: true, startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
    }),
    prismaUnfiltered.exam.findMany({
      where: { examDate: { gt: new Date() } },
      select: {
        id: true,
        name: true,
        examDate: true,
        examComponent: { select: { course: { select: { code: true, name: true } } } },
      },
      orderBy: { examDate: 'asc' },
    }),
    prismaUnfiltered.examComponent.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        categoryCode: true,
        questionCount: true,
        course: { select: { code: true, name: true } },
      },
      orderBy: { course: { code: 'asc' } },
    }),
  ])

  const { getCurrencySymbol } = await import('@/lib/currency')
  const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, userId)
  const eligibleComponents = filterForStudentTargets(examComponents, targetCategories)
  const balance = Number(wallet?.availableBalance || 0)
  const currency = wallet?.currency || 'EUR'
  const currencySymbol = getCurrencySymbol(currency)

  const ecMapped = eligibleComponents.map((ec) => ({
    id: ec.id,
    code: ec.code,
    name: ec.name,
    categoryCode: ec.categoryCode,
    questionCount: ec.questionCount,
    courseCode: ec.course.code,
    courseName: ec.course.name,
  })).sort((a, b) =>
    a.courseCode.localeCompare(b.courseCode, undefined, { numeric: true, sensitivity: 'base' }) ||
    a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
  )

  const uniqueMap = new Map<string, { id: string; code: string; name: string }>()
  examComponents.forEach((ec) => {
    if (!uniqueMap.has(ec.course.code)) {
      uniqueMap.set(ec.course.code, { id: ec.id, code: ec.course.code, name: ec.course.name })
    }
  })
  const resitComponents = Array.from(uniqueMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
  )

  return {
    wallet,
    pricing,
    openEvents,
    upcomingExams,
    examComponents: ecMapped,
    resitComponents,
    balance,
    currency,
    currencySymbol,
  }
}
