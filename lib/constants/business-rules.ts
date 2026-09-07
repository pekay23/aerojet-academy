/**
 * Centralised business rules and configuration constants.
 * Most of these should eventually move to the `SystemSetting` table so
 * staff can edit them at runtime — see `lib/settings.ts` for the runtime
 * loader. The values here are the build-time defaults consumed when the
 * `SystemSetting` row is absent.
 */

// ── Academic rules ─────────────────────────────────────────────────────
export const ACADEMIC_RULES = {
  /** EASA Standard pass mark for Part-66 modules */
  EASA_PASS_MARK: 75,

  /** General grade thresholds (used for traffic-light colouring) */
  GRADE_THRESHOLD_PASS: 75, // Green
  GRADE_THRESHOLD_WARNING: 50, // Amber

  /** Default values when a class / event doesn't specify its own */
  DEFAULT_MAX_CANDIDATES: 28,
  MAX_MODULES_PER_EVENT: 4,

  /** Max instructional hours per instructor per day (EASA Part-147) */
  MAX_DAILY_INSTRUCTIONAL_HOURS: 10,
} as const

// ── Pool / exam pool defaults ──────────────────────────────────────────
//
// `lib/pools/pricing-config.ts` is the runtime source of truth (loaded
// from SystemSetting). These constants are the *fallback defaults* used
// when the table hasn't been seeded yet — keep them in lock-step with the
// initial pricing seed in `prisma/seed.ts`.
export const POOL_DEFAULTS = {
  /** Minimum candidates required before a pool will auto-confirm */
  CONFIRM_THRESHOLD: 25,
  /** Hard cap on candidates per pool seat */
  MAX_CANDIDATES: 28,
  /** Seat price (EUR) before tier discounts */
  SEAT_PRICE_EUR: 300,
  /** Standard individual exam fee (EUR) */
  INDIVIDUAL_EXAM_FEE_EUR: 520,
  /** Days from event date by which all seats must be paid */
  PAYMENT_DEADLINE_DAYS: 21,
} as const

// ── Canonical email addresses ──────────────────────────────────────────
//
// Used as defaults across the codebase. `lib/email/sender.ts:DEFAULT_FROM`
// derives from `EMAIL_ADDRESSES.fromTransactional`. The contact form, the
// backup runner, and any new email path should pull from here so we don't
// drift across noreply@aerojet.aviation vs noreply@aerojet-academy.com.
export const EMAIL_ADDRESSES = {
  /** Default `from:` for transactional email (welcome / verification / etc.) */
  fromTransactional: 'Aerojet Academy <admissions@aerojet-academy.com>',
  /** Default `from:` for system-generated / no-reply email (backups, alerts) */
  fromNoReply: 'Aerojet Academy <noreply@aerojet-academy.com>',
  /** Address users can write to for support (visible in emails / contact form) */
  support: 'support@aerojet-academy.com',
  /** Address admissions team monitors */
  admissions: 'admissions@aerojet-academy.com',
} as const

// ── Wallet / finance defaults ──────────────────────────────────────────
export const WALLET_DEFAULTS = {
  CURRENCY: 'EUR',
  /** Initial wallet balance for a freshly-promoted student */
  INITIAL_BALANCE: 0,
  /** Resit fee default (overridable via pricing config) */
  RESIT_FEE_EUR: 150,
} as const

// ── Pathway / programme pricing defaults ────────────────────────────────
export const PATHWAY_PRICING = {
  FULL_TIME_4YEAR: {
    year1: 8500,
    total: 32000,
    name: 'EASA Part-66 Full-Time (4 Years)',
    years: 4,
  },
  FULL_TIME_2YEAR: {
    year1: 9500,
    total: 18000,
    name: 'EASA Part-66 Full-Time (2 Years)',
    years: 2,
  },
  MILITARY_1YEAR: { year1: 6500, total: 6500, name: 'Military Certification (1 Year)', years: 1 },
} as const

// ── Time windows ───────────────────────────────────────────────────────
export const TIME_WINDOWS = {
  /** GDPR Article 12(3) response SLA */
  DSR_DAYS: 30,
  /** Default attendance threshold (`lib/attendance.ts` may override per SystemSetting) */
  ATTENDANCE_THRESHOLD_PCT: 80,
  /** Bundle expiry default if not set on the bundle */
  BUNDLE_EXPIRY_DAYS: 365,
  /** Hours before exam the booking window closes */
  EXAM_CUTOFF_HOURS: 24,
  /** Estimated business days for payment proof verification */
  PAYMENT_VERIFICATION_DAYS: 2,
} as const

// ── Safe Exam Browser (SEB) ────────────────────────────────────────────
export const SEB = {
  /** Browser Exam Key used to validate SEB request hashes */
  BROWSER_EXAM_KEY: process.env.SEB_BROWSER_EXAM_KEY || '',
  /** Origins allowed to launch SEB config downloads */
  ALLOWED_ORIGINS: [
    'https://safeexambrowser.org',
    'https://safeexambrowser.org:4444',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
} as const
