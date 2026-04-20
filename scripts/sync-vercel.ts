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
    
    const targets = ['production', 'preview', 'development']
    for (const target of targets) {
      try {
        process.stdout.write(`  Syncing [${key}] to ${target}... `)
        // Use the exact command that was manually verified
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
