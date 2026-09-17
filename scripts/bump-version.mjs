import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const SKIP_TYPES = new Set([
  'docs',
  'test',
  'chore',
  'ci',
  'build',
  'style',
  'refactor',
])

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function getLastTag(branch) {
  try {
    const tags = execSync('git tag --sort=-v:refname', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
    const branchTag = tags.find((t) => t.startsWith(`${branch}/`))
    if (branchTag) return branchTag
    const untagged = tags.find((t) => !t.includes('/'))
    return untagged || null
  } catch {
    return null
  }
}

function getStagedCommitMessage() {
  const argPath = process.argv[2]
  if (argPath && fs.existsSync(argPath)) {
    return fs.readFileSync(argPath, 'utf8').trim()
  }
  const envPath = process.env.HUSKY_GIT_PARAMS
  if (envPath && fs.existsSync(envPath)) {
    return fs.readFileSync(envPath, 'utf8').trim()
  }
  try {
    return fs.readFileSync('.git/COMMIT_EDITMSG', 'utf8').trim()
  } catch {
    return ''
  }
}

function getCommitsSinceTag(tag) {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD'
    const log = execSync(
      `git log ${range} --pretty=format:"%H%x00%s%x00%b" --no-merges`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    const entries = log.split('\0').filter(Boolean)
    const commits = []
    for (let i = 0; i < entries.length; i += 3) {
      const hash = entries[i]?.trim()
      const subject = entries[i + 1]?.trim()
      const body = entries[i + 2]?.trim() || ''
      if (!hash || !subject) continue
      const typeMatch = subject.match(/^(\w+)(\([^)]*\))?(!)?\s*:/)
      const type = typeMatch ? typeMatch[1] : 'chore'
      const hasBreaking = body.includes('BREAKING CHANGE') || subject.includes('!')
      commits.push({ hash, subject, type, hasBreaking })
    }
    return commits
  } catch {
    return []
  }
}

function analyzeCurrentCommit(message) {
  const subject = message.split('\n')[0]
  const typeMatch = subject.match(/^(\w+)(\([^)]*\))?(!)?\s*:/)
  const type = typeMatch ? typeMatch[1] : 'chore'
  const hasBreaking = message.includes('BREAKING CHANGE') || subject.includes('!')
  const body = message.slice(subject.length + 1)
  const hasBreakingInBody = body.includes('BREAKING CHANGE')
  return { type, hasBreaking: hasBreaking || hasBreakingInBody }
}

function shouldBump(message) {
  const { type, hasBreaking } = analyzeCurrentCommit(message)
  if (hasBreaking) return 'major'
  if (SKIP_TYPES.has(type)) return null
  if (type === 'feat') return 'minor'
  if (['fix', 'perf', 'revert'].includes(type)) return 'patch'
  return 'patch'
}

function bumpVersion(bumpType) {
  const pkgPath = path.resolve(process.cwd(), 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const oldVersion = pkg.version
  const parts = oldVersion.split('.').map(Number)
  if (bumpType === 'major') {
    parts[0]++
    parts[1] = 0
    parts[2] = 0
  } else if (bumpType === 'minor') {
    parts[1]++
    parts[2] = 0
  } else {
    parts[2]++
  }
  const newVersion = parts.join('.')
  pkg.version = newVersion
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  const changelogPath = path.resolve(process.cwd(), 'docs/CHANGELOG.md')
  if (fs.existsSync(changelogPath)) {
    let changelog = fs.readFileSync(changelogPath, 'utf8')
    const today = new Date().toISOString().split('T')[0]
    if (!changelog.includes(`## [${newVersion}]`)) {
      const newEntry = `## [${newVersion}] — ${today}\n\n### Changed\n- Maintenance and stability updates.\n\n`
      changelog = changelog.replace('# Changelog\n\n', `# Changelog\n\n${newEntry}`)
      fs.writeFileSync(changelogPath, changelog)
    }
  }

  try {
    execSync('git add package.json docs/CHANGELOG.md', { stdio: 'ignore' })
    console.log(`✅ Version bumped ${oldVersion} → ${newVersion} (${bumpType}) and staged.`)
  } catch {
    console.warn('⚠️  Version bumped but could not stage package.json / CHANGELOG.md.')
  }
}

function main() {
  const message = getStagedCommitMessage()
  if (!message) {
    console.log('No commit message found — skipping version bump.')
    return
  }

  const bumpType = shouldBump(message)
  if (!bumpType) {
    const { type } = analyzeCurrentCommit(message)
    console.log(`Skipping version bump: commit type "${type}" is non-bump.`)
    return
  }

  const branch = getCurrentBranch()
  const lastTag = getLastTag(branch)
  const commits = getCommitsSinceTag(lastTag)
  const relevantCommits = commits.filter((c) => !SKIP_TYPES.has(c.type))
  if (relevantCommits.length === 0) {
    console.log('No bump-worthy commits since last tag — skipping version bump.')
    return
  }

  console.log(`Bumping version (${bumpType}) for branch "${branch}".`)
  bumpVersion(bumpType)
}

main()


