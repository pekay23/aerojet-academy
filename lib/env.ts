import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // Third Party
  RESEND_API_KEY: z.string().min(1),
  UPLOADTHING_SECRET: z.string().min(1),
  UPLOADTHING_APP_ID: z.string().min(1),

  // CMS
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).default('production'),

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
})

// Build-time safe-checks
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
  UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
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
