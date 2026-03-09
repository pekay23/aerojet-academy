import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'

/**
 * Public search API — searches courses, modules, and static pages.
 * Returns grouped results for the search modal.
 */

// Static pages searchable on the public website
const STATIC_PAGES = [
  { title: 'Home', description: 'Welcome to Aerojet Aviation Training Academy', url: '/', category: 'Pages' },
  { title: 'About Aerojet Academy', description: 'Learn about our EASA Part 147 certified facility in Accra, Ghana', url: '/about', category: 'Pages' },
  { title: 'Admissions', description: 'How to apply and enrollment requirements', url: '/admissions', category: 'Pages' },
  { title: 'Fees & Payment', description: 'Course fees, exam pricing, payment methods, and bank details', url: '/admissions/fees-and-payment', category: 'Pages' },
  { title: 'Contact Us', description: 'Get in touch with Aerojet Academy — phone, email, location', url: '/contact', category: 'Pages' },
  { title: 'Newsroom', description: 'Latest news, updates, and announcements from Aerojet Academy', url: '/newsroom', category: 'Pages' },
  { title: 'Privacy Policy', description: 'How we handle and protect your data', url: '/privacy-policy', category: 'Pages' },
  { title: 'Online Application Terms', description: 'Terms and conditions for online applications', url: '/online-application-terms', category: 'Pages' },
  { title: 'Login', description: 'Sign in to your Aerojet Academy portal', url: '/login', category: 'Pages' },
  { title: 'Register', description: 'Create a new Aerojet Academy account', url: '/register', category: 'Pages' },
  // Courses
  { title: '4-Year Full-Time Programme (B1.1 & B2)', description: 'Comprehensive EASA Part 66 training with guaranteed employment', url: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2', category: 'Courses' },
  { title: '2-Year Full-Time Programme (B1.1)', description: 'Accelerated EASA Part 66 B1.1 training pathway', url: '/courses/aircraft-engineering/easa-part-66/two-year-b1', category: 'Courses' },
  { title: 'Military / Industry Programme (1 Year)', description: 'Fast-track for military personnel with 5+ years experience', url: '/courses/aircraft-engineering/easa-part-66/military-certification', category: 'Courses' },
  { title: 'Modular Training', description: 'Flexible self-paced module-by-module EASA Part 66 study', url: '/courses/aircraft-engineering/easa-part-66/modular-training', category: 'Courses' },
  { title: 'Exam Only', description: 'Exam sitting for self-study candidates with learning materials', url: '/courses/aircraft-engineering/easa-part-66/exam-only', category: 'Courses' },
  { title: 'Revision Support', description: '8-week intensive revision series. Full pricing available in portal.', url: '/courses/aircraft-engineering/easa-part-66/revision-support', category: 'Courses' },
  { title: 'Exam Schedule 2026/2027', description: 'Upcoming EASA exam events and dates', url: '/courses/aircraft-engineering/exam-schedule', category: 'Courses' },
  // Exam info
  { title: 'Exam Pool Booking', description: 'Join a group exam pool — most popular option', url: '/admissions/fees-and-payment', category: 'Exams' },
  { title: 'Individual Exam Seat', description: 'Guaranteed exam slot with premium flexibility', url: '/admissions/fees-and-payment', category: 'Exams' },
  { title: 'Twin Pack (2-Seat Bundle)', description: 'Two exam seats, any modules, valid 12 months', url: '/admissions/fees-and-payment', category: 'Exams' },
  { title: '4-Pack Bundle', description: 'Four exam seats, best value, valid 12 months', url: '/admissions/fees-and-payment', category: 'Exams' },
  { title: 'Exam Resit', description: 'Retake a previously failed exam, subject to availability', url: '/admissions/fees-and-payment', category: 'Exams' },
  { title: 'Group Charter', description: 'Organization or military group charter for up to 28 candidates', url: '/admissions/fees-and-payment', category: 'Exams' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const lower = query.toLowerCase()

  // 1. Search static pages
  const pageResults = STATIC_PAGES.filter(
    (p) =>
      p.title.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  ).slice(0, 8)

  // 2. Search courses/modules from DB
  let courseResults: { title: string; description: string; url: string; category: string }[] = []
  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, code: true, name: true, description: true },
      take: 6,
    })

    courseResults = courses.map((c) => ({
      title: `${c.code} — ${c.name}`,
      description: c.description || 'EASA Part 66 Module',
      url: '/courses',
      category: 'Modules',
    }))
  } catch {
    // DB unavailable — static results only
  }

  // Deduplicate by url+title
  const seen = new Set<string>()
  const allResults = [...courseResults, ...pageResults].filter((r) => {
    const key = `${r.url}|${r.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return NextResponse.json({ results: allResults })
}
