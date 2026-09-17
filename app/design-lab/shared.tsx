'use client'

/* ──────────────────────────────────────────────────────────────
   Shared real-content fixtures for the Aerojet homepage design lab.
   Every variant pulls copy from here so the comparison is fair and
   grounded in the ACTUAL site text. Images are the project's own
   aviation photography; each variant treats them differently.
   ────────────────────────────────────────────────────────────── */

export const IMG = {
  heroA: '/images/hero/hero-slide1.webp',
  heroB: '/images/hero/hero-slide2.webp',
  heroC: '/images/hero/hero-slide3.webp',
  hangar: '/images/hero/hanger.webp',
  lecture: '/images/hero/lecture.webp',
  lecturer: '/images/hero/lecturer2.webp',
  students: '/images/hero/students.webp',
  undercarriage: '/images/hero/undercarage.webp',
  takeoff: '/images/hero/takeoff.webp',
  aircraftFull: '/images/hero/aircraft-full.webp',
  engine: '/images/courses/aircraft-engine-crossection.webp',
  careers: '/images/careers/aircraftcareers.webp',
  student: '/images/home/al4.webp',
} as const

export const HERO = {
  eyebrow: 'EASA Part-66 · Accra, Ghana',
  headline: 'Your Journey to Becoming a Certified Aircraft Technician Starts Here.',
  subhead:
    'World-class aviation technical training in Accra — structured pathways to EASA Part-66 B1/B2 standards.',
}

export const STATS = [
  { value: 'Part 147', label: 'EASA Certified', sub: 'Approved training organisation' },
  { value: 'B1 & B2', label: 'Licence Categories', sub: 'Mechanical & Avionics' },
  { value: 'Worldwide', label: 'Recognition', sub: 'Globally accepted qualification' },
  { value: '28', label: 'Max Class Size', sub: 'Students per cohort' },
] as const

export const WHO = {
  eyebrow: 'Who We Are',
  title: 'Building the Future of African Aviation',
  body: 'Aerojet Aviation Training Academy is Africa’s foremost institution and leader in the field of Aviation Training and Engineering. Training engineers for one of the most demanding professions in the world is a truly important responsibility that we take very seriously.',
  body2:
    'During your training, you will gain direct insight into how work is carried out in a live aircraft hangar, supported by opportunities to train in our EASA Part 145 Facility or at partner facilities worldwide.',
  includes: [
    'Live Hangar Experience',
    'EASA Part-145 Standards',
    'Global Partner Network',
    'Hands-on Mentorship',
  ],
} as const

export const JOURNEY = [
  {
    k: 'Classroom & Workshop Training',
    d: 'Foundational theory and hands-on practice in our modern facilities.',
  },
  { k: 'EASA Examinations', d: 'Successfully pass all required modules to prove your knowledge.' },
  {
    k: 'Work Experience & Job Placement',
    d: 'Gain required OJT and launch your career with our partner network.',
  },
] as const

export const PROGRAMMES = [
  {
    title: '4-Year Full-Time',
    badge: 'Flagship',
    desc: 'Our flagship EASA-certified program for aspiring engineers. Comprehensive B1/B2 training.',
    href: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2',
  },
  {
    title: '2-Year Full-Time',
    badge: null,
    desc: 'An accelerated B1.1 mechanical certification path focused on core engineering excellence.',
    href: '/courses/aircraft-engineering/easa-part-66/two-year-b1',
  },
  {
    title: 'Modular Training',
    badge: null,
    desc: 'Flexible, self-paced study with expert support. Enroll in specific EASA modules as needed.',
    href: '/courses/aircraft-engineering/easa-part-66/modular-training',
  },
  {
    title: 'Military / Industry',
    badge: null,
    desc: 'A 1-year fast-track for experienced personnel entering civil aviation maintenance.',
    href: '/courses/aircraft-engineering/easa-part-66/military-certification',
  },
] as const

export const CAREERS = [
  'Commercial Airlines',
  'Maintenance, Repair & Overhaul (MRO) Facilities',
  'Aircraft Manufacturing Companies',
  'Military and Defence Contractors',
  'Specialist Engineering Firms',
] as const

export const LICENSING = {
  intro:
    'At Aerojet, we train engineers to EASA Certification standards—the most widely accepted qualification in the industry. We focus on the higher-level Category B License.',
  b1: {
    title: 'Category B1 — Mechanical',
    body: 'Issue certifications of release to service following maintenance on aircraft structure, power plants, and mechanical/electrical systems.',
    rows: [
      ['B1.1', 'Aeroplanes Turbine'],
      ['B1.2', 'Aeroplanes Piston'],
      ['B1.3', 'Helicopters Turbine'],
      ['B1.4', 'Helicopters Piston'],
    ] as [string, string][],
  },
  b2: {
    title: 'Category B2 — Avionics',
    body: 'Issue certificates of release to service following maintenance on avionic and electrical systems.',
    focus: [
      'Communication & Navigation',
      'Radar Equipment',
      'Guidance & Control Systems',
      'Auto-pilot & Auto-land',
      'Cabin Entertainment',
    ],
  },
} as const

export const ENROLL = [
  {
    n: '01',
    t: 'Register',
    d: 'Fill out the online application form with your personal details and select your programme.',
  },
  {
    n: '02',
    t: 'Choose Pathway',
    d: 'Select your preferred EASA Part-66 training pathway — full-time, modular, or military.',
  },
  {
    n: '03',
    t: 'Make Payment',
    d: 'Pay the one-time registration fee via bank transfer or mobile money.',
  },
  {
    n: '04',
    t: 'Begin Training',
    d: 'Once approved, receive your portal login and prepare for your first class.',
  },
] as const

export const PARTNERS = [
  'EASA',
  'USTDA',
  'Ghana Air Force',
  'Joramco',
  'GAPTEK',
  'Aerojet Foundation',
] as const

export function ArrowR({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img loading="lazy" alt="" {...props} />
}
