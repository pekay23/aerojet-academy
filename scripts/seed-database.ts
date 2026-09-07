#!/usr/bin/env tsx
/**
 * Seed database with initial data
 * Usage: npx tsx scripts/seed-database.ts
 */
import { execSync } from 'child_process'

console.log('🌱 Running database seed...')
execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
console.log('✅ Done')


