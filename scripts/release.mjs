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
    const prefix = `${branch}/`
    const branchTag = tags.find((t) => t.startsWith(prefix))
    if (branchTag) return branchTag
    const untagged = tags.find((t) => !t.includes('/'))
    return untagged || null
  } catch {
    return null
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
      const typeMatch = subject.match(/^\w+\s+(\w+)(\([^)]*\))?(!)?\s*:/)
      const type = typeMatch ? typeMatch[1] : 'chore'
      const hasBreaking = body.includes('BREAKING CHANGE') || subject.includes('!')
      commits.push({ hash, subject, type, hasBreaking })
    }
    return commits
  } catch {
    return []
  }
}

function determineBumpType(commits) {
  const relevant = commits.filter((c) => !SKIP_TYPES.has(c.type))
  if (relevant.length === 0) {
    console.log(
      'No version-bump commits since last tag (all docs/test/chore/ci/build/style/refactor). Skipping release.'
    )
    process.exit(0)
  }
  const hasBreaking = relevant.some((c) => c.hasBreaking)
  const types = relevant.map((c) => c.type)
  if (hasBreaking) return 'major'
  if (types.includes('feat')) return 'minor'
  if (types.includes('fix') || types.includes('perf') || types.includes('revert')) return 'patch'
  return 'patch'
}

function writeTempReleaserc(branch, bumpType) {
  const config = {
    git: {
      commitMessage: 'chore(release): ${version}',
      tagName: `${branch}/v${version}`,
      push: true,
      requireCleanWorkingDir: false,
    },
    github: { release: false },
    npm: { publish: false },
    hooks: {
      'before:init': [
        'bun run type-check',
        'bun run test --run --no-file-parallelism --no-color',
      ],
    },
    plugins: {
      '@release-it/conventional-changelog': {
        infile: 'docs/CHANGELOG.md',
        preset: {
          name: 'conventionalcommits',
          types: [
            { type: 'feat', section: 'Features', hidden: false },
            { type: 'fix', section: 'Bug Fixes', hidden: false },
            { type: 'perf', section: 'Performance Improvements', hidden: false },
            { type: 'revert', section: 'Reverts', hidden: false },
            { type: 'docs', section: 'Documentation', hidden: false },
            { type: 'style', section: 'Styles', hidden: true },
            { type: 'chore', section: 'Maintenance', hidden: false },
            { type: 'refactor', section: 'Code Refactoring', hidden: true },
            { type: 'test', section: 'Tests', hidden: true },
            { type: 'build', section: 'Build System', hidden: true },
            { type: 'ci', section: 'CI/CD', hidden: true },
          ],
        },
      },
    },
  }

  const tmpPath = path.join(process.cwd(), '.releaserc.tmp.json')
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2))
  return tmpPath
}

function main() {
  const branch = getCurrentBranch()
  const lastTag = getLastTag(branch)
  const commits = getCommitsSinceTag(lastTag)
  const bumpType = determineBumpType(commits)

  console.log(`\nBranch:        ${branch}`)
  console.log(`Last tag:      ${lastTag ?? 'none'}`)
  console.log(`Commits since: ${commits.length}`)
  console.log(`Bump type:     ${bumpType}\n`)

  const args = process.argv.slice(2)
  if (args.includes('--dry-run')) {
    console.log('Dry-run mode — not invoking release-it.')
    process.exit(0)
  }

  const tmpConfig = writeTempReleaserc(branch, bumpType)

  try {
    const cmd = `bunx release-it --${bumpType} --config=${tmpConfig}`
    console.log(`Running: ${cmd}\n`)
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
  } catch (err) {
    console.error('release-it failed:', err.message)
    process.exit(1)
  } finally {
    try {
      fs.unlinkSync(tmpConfig)
    } catch {
      // ignore cleanup errors
    }
  }
}

main()
