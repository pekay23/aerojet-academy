// ═══════════════════════════════════════════════════════════════════════════
// ⚠️  CRITICAL: DO NOT MODIFY THIS FILE WITHOUT READING THE COMMENT BELOW  ⚠️
// ═══════════════════════════════════════════════════════════════════════════
//
// 📌 HISTORICAL LESSONS (2026-07-24):
//
// ❌ PROBLEM: Missing env vars in processEnv object
//    The processEnv object was missing several env vars that were defined
//    in the schema (STRIPE_WEBHOOK_SECRET, UPSTASH_REDIS_REST_URL,
//    UPSTASH_REDIS_REST_TOKEN, RECAPTCHA_SECRET_KEY, ADMIN_EMAIL,
//    ADMIN_PASSWORD, VERCEL, VERCEL_ENV, VERCEL_URL). This meant they
//    were always undefined at runtime, creating a false sense of validation.
//
// ✅ FIX: Every env var in the schema must also be in processEnv.
//    If you add a new env var to the schema, add it to processEnv too.
//
// ❌ PROBLEM: No server-only guard
//    This file could be imported from client components, potentially
//    exposing server secrets (DATABASE_URL, NEXTAUTH_SECRET, etc.)
//    in the browser bundle.
//
// ✅ FIX: Added `import 'server-only'` at the top. Next.js will throw
//    a build error if any client component tries to import this file.
//
// 🔒 RULES FOR FUTURE MODIFICATIONS:
//    1. ALWAYS add new env vars to BOTH the schema AND processEnv
//    2. NEVER remove `import 'server-only'` from this file
//    3. NEVER commit .env files with secrets to git
//    4. Set all production secrets in Vercel Dashboard, never in .env files
//    5. NEXT_PUBLIC_* vars are safe for client — everything else is server-only
// ═══════════════════════════════════════════════════════════════════════════

import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  LOCAL_DATABASE_URL: z.string().url().optional(),
  AEROJET_LOCAL_DB_ADAPTER: z.enum(['pg', 'neon']).optional(),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().optional(),

  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // Third Party
  RESEND_API_KEY: z.string().min(1),
  UPLOADTHING_SECRET: z.string().min(1),
  UPLOADTHING_APP_ID: z.string().min(1),

  // Supabase (Optional - for backup/replica)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_DATABASE_URL: z.string().url().optional(),
  SUPABASE_BACKUP_ENABLED: z.boolean().optional().default(false),
  SUPABASE_BACKUP_BUCKET: z.string().optional().default('backups'),

  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
  FROM_EMAIL: z.string().email().optional().default('admissions@mail.aerojet-academy.com'),

  // Optional Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Webhook Signing Secrets
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  // Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // reCAPTCHA
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Admin seed credentials (dev only)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  // Vercel-specific
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
  VERCEL_URL: z.string().optional(),
})

// Build-time safe-checks
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  LOCAL_DATABASE_URL: process.env.LOCAL_DATABASE_URL,
  AEROJET_LOCAL_DB_ADAPTER: process.env.AEROJET_LOCAL_DB_ADAPTER,
  DB_CONNECT_TIMEOUT_MS: process.env.DB_CONNECT_TIMEOUT_MS,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
  UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
  SUPABASE_BACKUP_ENABLED: process.env.SUPABASE_BACKUP_ENABLED === 'true',
  SUPABASE_BACKUP_BUCKET: process.env.SUPABASE_BACKUP_BUCKET,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  FROM_EMAIL: process.env.FROM_EMAIL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
}

const parsed = isBuildTime
  ? envSchema.partial().safeParse(processEnv)
  : envSchema.safeParse(processEnv)

if (!parsed.success) {
  if (isBuildTime) {
    console.warn(
      '⚠️ Some environment variables are missing during build time. This is expected if they are not needed for the build.'
    )
  } else {
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(parsed.error.format(), null, 4)
    )
    throw new Error('Invalid environment variables')
  }
}

export const env = (parsed.success ? parsed.data : processEnv) as z.infer<typeof envSchema>
