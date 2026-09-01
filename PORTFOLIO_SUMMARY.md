# Aerojet Aviation Training Academy — Portfolio Summary

Drop-in copy for your portfolio site. Pick the version that matches the framing you want (past build vs. live product), and the answered template at the bottom.

---

## Short pitch (2–3 sentences, hero card)

Aerojet Aviation Training Academy is a full-stack EASA Part-66 learning and operations platform I designed and built end-to-end: a multi-portal Next.js application that runs the academy's real workflow — from applicant aptitude testing and interview scheduling, through course enrollment and wallet-based payments, to pooled exam sessions, grading, and EASA-style certificate issuance. It replaces a sprawl of spreadsheets, BambooHR, email chains, and a third-party LMS with one role-aware system used by applicants, students, instructors, examiners, finance staff, and admins.

---

## Long description (case study body, ~250 words)

**Aerojet needed one system to run the entire student lifecycle** for a Part-147 aviation maintenance training academy in Ghana. Previously, applications were scraped from a website into BambooHR, aptitude testing happened offline, interview slots were coordinated by hand, enrollment and payments lived in spreadsheets, exam bookings were tracked in email, and students accessed materials on a third-party platform (Dreamclass). Nothing talked to anything else, and finance had to reconcile cash, bank transfers, and exam fees by hand.

I built **Aerojet Academy** as a single Next.js 16 (App Router) + React 19 + TypeScript application on top of PostgreSQL (Neon primary, Supabase mirror) with Prisma 7. The system has **four role-specific portals** plus a public marketing surface: applicants register, take a proctored (fullscreen-locked, timed) aptitude test, and book interview slots; students get a dashboard, wallet, pooled exam booking, grades, and digital certificates; instructors manage classes, attendance, and grading; examiners run the on-site pooled exam sessions; and staff/admin handle approvals, finance, reports, and a fully configurable academy catalog.

The non-obvious work is in the **business logic**: five enrollment pathways (4-year, 2-year, 1-year military, modular, exam-only) that auto-enroll or hide modules based on role; a **pool-based exam scheduler** that groups up to four modules per 28-seat exam session with multi-pack booking rules; a **wallet + reservation system** that holds funds on pool join and captures or releases them on confirm/fail; **role-aware catalog visibility** so exam-only students never see tuition material and full-time students never see à la carte modules; and an **EASA-compliant Part-66 module graph** (1–17 with 7A/7B, 9A/9B, 11A/B/C, 17A/17B splits) where a higher-level exam automatically satisfies a lower-level license category.

**Outcome:** the academy's first 50-student cohort (split into two classes, B1.1 and B2 license tracks) ran end-to-end on the platform from registration through graded exams and certificate issuance; finance reconciles payments in-app; and the same codebase is now the operational backbone for new modular and exam-only applicants joining the academy.

---

## Bulleted feature list (for the project page sidebar / tags)

- 4 user portals + 1 public marketing site in one Next.js monorepo
- Role-based access control across Applicant / Student / Instructor / Examiner / Staff / Admin
- Proctored, fullscreen-locked, timed aptitude test with anti-cheat
- Self-serve interview scheduling with admin-configurable slots and capacity
- Course catalog with EASA Part-66 module graph (Modules 1–17, A/B/C splits)
- 5 enrollment pathways: 4-year full-time, 2-year full-time, 1-year military, modular, exam-only
- Auto-enrollment engine for full-time pathways; manual for modular; exam-only locks tuition content
- Wallet system: top-up → staff approval → balance → reserve on pool join → capture/release
- Pool-based exam scheduler: 28 seats × up to 4 modules per session, multi-pack booking rules
- Attendance, grading, and digital certificate generation (PDF + QR)
- Payment proof upload (bank transfer) with staff approval workflow
- Email transactional pipeline (Resend) for every state transition
- Marketing site with reusable section kit and self-hosted fonts
- Dual-database setup (Neon primary, Supabase mirror) with logical replication
- Storybook component library, Vitest unit tests, Playwright E2E, ESLint + Prettier + Husky
- Full design system, accessibility (WCAG 4.5:1 contrast, 44×44 touch targets), and dark mode

---

## Tech stack (one-liner + tag chips)

**Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL (Neon + Supabase) · Prisma 7 · NextAuth v4 · Tailwind CSS 4 · shadcn/ui · Radix · Framer Motion · GSAP · TipTap · react-pdf · Resend · UploadThing · React Hook Form + Zod · Vitest · Playwright · Storybook**

---

## The answered template

> **PROJECT:** Aerojet Aviation Training Academy
> **INDUSTRY:** Education / EdTech (Aviation Training)
> **WHAT IT DOES:** A multi-portal EASA Part-66 training platform that runs the entire student lifecycle — aptitude testing, enrollment, payments, pooled exams, grading, and certificate issuance — for an aviation maintenance academy.
> **THE PROBLEM:** The academy's operations were scattered across a public website, BambooHR, spreadsheets, email, and a third-party LMS (Dreamclass). Aptitude testing was offline, interview slots were coordinated by hand, finance reconciled payments manually, and exam scheduling couldn't group students across modules efficiently. Nothing talked to anything else, and there was no way to enforce the EASA Part-66 module/level rules (higher exam satisfies lower license) or the academy's 5 distinct enrollment pathways.
> **WHAT YOU BUILT:** A single Next.js 16 + React 19 + TypeScript application on PostgreSQL/Prisma with 4 role-specific portals (Applicant, Student, Instructor/Examiner, Staff/Admin) plus a public marketing site. Core systems: proctored aptitude test engine, self-serve interview scheduler, EASA Part-66 module graph, 5-pathway enrollment engine, wallet + reservation system, pool-based exam scheduler (28 seats × up to 4 modules per session with multi-pack rules), attendance/grading, PDF certificate generator, and a Resend-powered transactional email pipeline. UX built on a Tailwind 4 + shadcn/ui + Radix design system with Storybook, Vitest, and Playwright.
> **THE RESULT:** Successfully ran the academy's first cohort of ~50 students (two classes, B1.1 and B2 license tracks) end-to-end on the platform — from application and aptitude test through graded exams and certificate issuance. The same system now serves new modular and exam-only applicants, with finance reconciling payments in-app instead of by spreadsheet.
> **PERMISSION:** It's mine — I designed and built it as a freelance/contract project for Aerojet Aviation Training Academy. The codebase, design system, and documentation are mine; the brand, student data, and academy content belong to the client. For portfolio use, **anonymize** the live URLs and any student imagery, and **do not** show admin/student dashboards containing real PII.
> **LINKS:**
> - **Live (public surface only):** *[add once you have a stable marketing URL — keep admin/student portals off the public portfolio]*
> - **GitHub:** `https://github.com/pekay23/aerojet-academy` *(consider a public sanitized mirror or a private repo with a screenshot tour if the client contract is exclusive)*
> - **Screenshots / case study:** *[link to a Notion / Framer / read.cv case study with the visuals you control]*
> - **Docs (proof of depth):** `docs/html/index.html` — architecture, security, audits, plans

---

## Variants you can swap in

### 1-line tagline
> A multi-portal EASA Part-66 training platform — 4 portals, 5 enrollment pathways, pooled exams, and a wallet system — built end-to-end for an aviation maintenance academy.

### 2-line tagline (for cards)
> Next.js 16 multi-portal platform for an EASA Part-147 aviation training academy. Replaces BambooHR + spreadsheets + email + Dreamclass with one role-aware system covering aptitude testing, enrollment, wallet payments, pool-based exam scheduling, grading, and digital certificates.

### Twitter / X (≤280)
> Built Aerojet Academy: a multi-portal Next.js platform that runs an EASA Part-66 aviation training academy end-to-end — aptitude tests, enrollment, wallet, pooled exams, certificates. 4 portals, 5 pathways, 1 codebase.

### LinkedIn post opener
> Most "LMS" projects are CRUD on courses. Aerojet Academy is the operational backbone of a real aviation training academy in Ghana: 4 portals, 5 enrollment pathways (4-yr, 2-yr, 1-yr military, modular, exam-only), a wallet that reserves funds on pool join and captures on confirm, and a 28-seat exam pool scheduler that groups up to 4 modules per session. Built solo on Next.js 16 + Prisma 7 + PostgreSQL. 🛩️

---

## Portfolio-page section order suggestion

1. **Hero** — short pitch + 1 screenshot of the applicant landing or student dashboard
2. **The problem** — 3 bullets on the operational chaos (BambooHR, spreadsheets, Dreamclass)
3. **What I built** — portal grid (Applicant / Student / Instructor / Staff) with one screenshot each
4. **The hard parts** — 3 deep-dive cards: pool-based exam scheduler · wallet + reservation system · 5-pathway enrollment engine
5. **Result** — first cohort stat, current usage, any client quote
6. **Stack** — tag chips
7. **Links** — case study, GitHub, live (public only)

---

## Things to add once you have them

- [ ] A client testimonial quote (even one line, attributed by role — "Academy Director" is fine)
- [ ] A live URL for the public marketing site (NOT the admin/student portals)
- [ ] A sanitized screenshot tour — applicant dashboard, student wallet, exam pool admin, certificate PDF
- [ ] A short Loom walkthrough of the pool scheduler (it's the most visually interesting feature)
- [ ] A "lessons learned" line for the bottom of the case study (e.g. "Why I split the NextAuth config into edge-safe + node-only, and what I'd do differently with Prisma 7 adapters")
