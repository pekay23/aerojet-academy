import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { randomBytes, createHmac } from 'crypto'

dotenv.config()

async function main() {
  console.log('--- Security Rotation Verification ---')
  
  const results = {
    database: false,
    auth: false,
    resend: false,
    uploadthing: false
  }

  // 1. Database (Neon/Prisma)
  try {
    console.log('Testing Database connection...')
    const prisma = (await import('../lib/prisma/client.js')).default;
    await (prisma as any).$connect()
    await (prisma as any).user.findFirst({ select: { id: true } })
    console.log('✅ Database: Connected successfully')
    results.database = true
    await (prisma as any).$disconnect()
  } catch (err) {
    console.error('❌ Database: Connection failed', err)
  }

  // 2. Auth (NextAuth Secret)
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (secret && (secret.length >= 32)) {
      console.log('✅ NextAuth Secret: Valid length and present')
      results.auth = true
    } else {
      throw new Error('Secret too short or missing')
    }
  } catch (err) {
    console.error('❌ Auth: Secret verification failed', err)
  }

  // 3. Resend (Simple Key Format Check)
  try {
    const key = process.env.RESEND_API_KEY
    if (key?.startsWith('re_')) {
      console.log('✅ Resend API Key: Format looks valid')
      results.resend = true
    } else {
      throw new Error('Invalid key format')
    }
  } catch (err) {
    console.error('❌ Resend: API Key check failed', err)
  }

  // 4. UploadThing (Simple Key Format Check)
  try {
    const secret = process.env.UPLOADTHING_SECRET
    if (secret?.startsWith('sk_live_')) {
      console.log('✅ UploadThing Secret: Format looks valid')
      results.uploadthing = true
    } else {
      throw new Error('Invalid secret format')
    }
  } catch (err) {
    console.error('❌ UploadThing: Secret check failed', err)
  }

  console.log('\n--- Final Audit ---')
  const allClear = Object.values(results).every(v => v === true)
  if (allClear) {
    console.log('🎉 ALL ROTATED KEYS VERIFIED LOCALLY')
  } else {
    console.log('⚠️ SOME KEYS FAILED VERIFICATION. Check logs above.')
  }
}

main()
