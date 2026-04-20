import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

async function syncVercel() {
  console.log('--- Automated Vercel Environment Sync ---')
  
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found')
    return
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (!match) continue

    const key = match[1].trim()
    let value = match[2].trim()

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1)
    }

    if (!key || !value) continue

    console.log(`\nProcessing [${key}]...`)
    
    // 1. Exhaustive Clean (Loop until all instances are gone)
    let deletedCount = 0
    let stillDeleting = true
    while (stillDeleting) {
      try {
        execSync(`vercel env rm ${key} --yes`, { stdio: 'ignore' })
        deletedCount++
      } catch (err) {
        // When it fails, it means there are no more instances left
        stillDeleting = false
      }
    }
    console.log(`  ✅ Instances removed: ${deletedCount}`)

    // 2. Fresh Global Sync with --force to ensure overrides
    const targets = ['production', 'preview', 'development']
    for (const target of targets) {
      try {
        process.stdout.write(`  Syncing to ${target}... `)
        // Use individual add with force
        const command = `vercel env add ${key} ${target} --value "${value.replace(/"/g, '\\"')}" --yes --force`
        execSync(command, { stdio: 'ignore' })
        console.log(`✅`)
      } catch (err) {
        console.error(`❌ Failed`)
      }
    }
  }

  console.log('\n--- Sync Complete ---')
  console.log('Run "vercel env ls" to verify.')
}

syncVercel()
