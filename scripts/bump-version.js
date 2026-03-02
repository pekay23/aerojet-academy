import { execSync } from 'child_process'

/**
 * Automatically bumps the patch version in package.json and stages the changes.
 * This is designed to be run as a pre-commit hook via Husky.
 */
function bumpVersion() {
  try {
    console.log('Bumping application version...')

    // 1. Increment patch version (e.g., 1.0.0 -> 1.0.1)
    // --no-git-tag-version: Updates package.json/package-lock.json but does NOT create a Git tag/commit
    execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' })

    // 2. Stage the modified files so they are included in the current commit
    execSync('git add package.json package-lock.json', { stdio: 'inherit' })

    console.log('✅ Version bumped and staged.')
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
