'use client'

import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ArrowRight, Clock, Construction } from 'lucide-react'

const courseData = [
  {
    value: 'aircraft-engineering',
    title: 'Aircraft Engineering',
    subTitle: 'EASA Part-66 Certification Programmes',
    programs: [
      {
        name: '4-Year Full-Time (B1.1 & B2)',
        href: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2',
      },
      {
        name: '2-Year Full-Time (B1.1)',
        href: '/courses/aircraft-engineering/easa-part-66/two-year-b1',
      },
      {
        name: 'Military / Industry (1 Year)',
        href: '/courses/aircraft-engineering/easa-part-66/military-certification',
      },
      {
        name: 'Modular Training',
        href: '/courses/aircraft-engineering/easa-part-66/modular-training',
      },
      { name: 'Exam Only', href: '/courses/aircraft-engineering/easa-part-66/exam-only' },
      {
        name: 'Revision Support',
        href: '/courses/aircraft-engineering/easa-part-66/revision-support',
      },
      { name: 'Exam Schedule 2026/2027', href: '/courses/aircraft-engineering/exam-schedule' },
    ],
    otherSections: [
      { name: 'Skilled Training Programs', details: 'Details coming soon.' },
      { name: 'Certified Short Knowledge Courses', details: 'Details coming soon.' },
      { name: 'Aircraft Work Experience Program', details: 'Coming soon.' },
    ],
  },
  { value: 'pilot-training', title: 'Pilot Training', comingSoon: true },
  { value: 'cabin-crew', title: 'Cabin Crew', comingSoon: true },
]

export default function CourseListings() {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="aircraft-engineering"
      className="mx-auto w-full max-w-4xl"
    >
      {courseData.map((category) => (
        <AccordionItem value={category.value} key={category.value}>
          {/* FIX: Increased trigger font size */}
          <AccordionTrigger className="text-public-primary py-6 text-left text-3xl font-black hover:no-underline sm:text-4xl">
            {category.title}
            {category.comingSoon && (
              <span className="ml-4 text-lg font-normal text-slate-400">(Coming Soon)</span>
            )}
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            {!category.comingSoon ? (
              <div className="border-l-2 border-slate-200 pl-6">
                {/* FIX: Increased sub-title font size */}
                <h4 className="text-public-secondary mb-6 text-xl font-bold">
                  {category.subTitle}
                </h4>
                <div className="mb-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {category.programs?.map((prog) => (
                    <Link
                      key={prog.name}
                      href={prog.href}
                      className="group flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-slate-100"
                    >
                      {/* FIX: Increased link font size */}
                      <span className="text-base font-medium text-slate-800">{prog.name}</span>
                      <ArrowRight className="group-hover:text-public-secondary h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
                {category.otherSections &&
                  category.otherSections.map((section) => (
                    <div key={section.name} className="flex items-center gap-4 p-3 text-slate-600">
                      <Construction className="h-5 w-5" />
                      <span className="text-base">
                        {section.name} - <em className="text-slate-500">{section.details}</em>
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="pl-6 text-base text-slate-500 italic">
                Details for this program will be announced soon. Please check back later.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
