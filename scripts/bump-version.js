import { execSync } from 'child_process'

/**
 * Automatically bumps the patch version in package.json and stages the changes.
 * This is designed to be run as a pre-commit hook via Husky.
 */
import fs from 'fs'
import path from 'path'

/**
 * Automatically bumps the version in package.json and updates the CHANGELOG.md.
 * This is designed to be run as a pre-commit hook via Husky.
 */
function bumpVersion() {
  try {
    console.log('Bumping application version...')

    // 1. Get current version before bump
    const pkgPath = path.resolve(process.cwd(), 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    const oldVersion = pkg.version

    // 2. Determine bump type (default to patch)
    const bumpType = process.env.BUMP_TYPE || 'patch'
    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      throw new Error('Invalid BUMP_TYPE. Use major, minor, or patch.')
    }

    // 3. Increment version
    // We use 'bun x version-bump' or manually update to avoid 'npm' dependency
    // For simplicity and robustness, we'll use bun x to run a versioning tool
    execSync(`bun x version-bump ${bumpType} --no-git-tag`, { stdio: 'inherit' })

    // 3. Get new version after bump
    const newPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    const newVersion = newPkg.version

    // 4. Update CHANGELOG.md
    const changelogPath = path.resolve(process.cwd(), 'docs/CHANGELOG.md')
    if (fs.existsSync(changelogPath)) {
      console.log('Updating CHANGELOG.md...')
      let changelog = fs.readFileSync(changelogPath, 'utf8')
      const today = new Date().toISOString().split('T')[0]
      
      // If the new version isn't already in the changelog, insert it
      if (!changelog.includes(`## [${newVersion}]`)) {
        const newEntry = `## [${newVersion}] — ${today}\n\n### Changed\n- Maintenance and stability updates.\n\n`
        changelog = changelog.replace('# Changelog\n\n', `# Changelog\n\n${newEntry}`)
        fs.writeFileSync(changelogPath, changelog)
      }
    }

    // 5. Stage the modified files so they are included in the current commit
    execSync(`git add package.json docs/CHANGELOG.md`, { stdio: 'inherit' })
    
    // Also try to stage lock files if they exist
    if (fs.existsSync(path.resolve(process.cwd(), 'package-lock.json'))) {
      execSync('git add package-lock.json', { stdio: 'inherit' })
    }
    if (fs.existsSync(path.resolve(process.cwd(), 'bun.lock'))) {
      execSync('git add bun.lock', { stdio: 'ignore' })
    }

    console.log(`✅ Version bumped from ${oldVersion} to ${newVersion} and staged.`)
  } catch (error) {
    console.error('❌ Failed to bump version:', error.message)
    process.exit(1)
  }
}

// Check if we are in a Git merge or rebase to avoid bumping during merges
const isMerging = () => {
  try {
    execSync('git rev-parse --verify MERGE_HEAD', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

if (!isMerging()) {
  bumpVersion()
} else {
  console.log('Skipping version bump during merge/rebase.')
}
