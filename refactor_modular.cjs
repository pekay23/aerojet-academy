const fs = require('fs')
const path = require('path')

const DIRECTORIES = ['app', 'components', 'lib']
const EXTENSIONS = ['.ts', '.tsx']

const REPLACEMENTS = [
  { regex: /'MODULAR'/g, replacement: "'FLEXIBLE_COURSES'" },
  { regex: /"MODULAR"/g, replacement: '"FLEXIBLE_COURSES"' },
  { regex: /MODULAR: 'Modular'/g, replacement: "FLEXIBLE_COURSES: 'Flexible Courses'" },
  { regex: /ModularPackage/g, replacement: 'FlexiblePackage' },
  { regex: /ModularEnrollment/g, replacement: 'FlexibleEnrollment' },
  { regex: /modularPackage/g, replacement: 'flexiblePackage' },
  { regex: /modularEnrollment/g, replacement: 'flexibleEnrollment' },
  { regex: /modularPackages/g, replacement: 'flexiblePackages' },
  { regex: /modularEnrollments/g, replacement: 'flexibleEnrollments' },
  { regex: /enrollmentType: 'MODULAR'/g, replacement: "enrollmentType: 'FLEXIBLE_COURSES'" },
  { regex: /EnrollmentType\.MODULAR/g, replacement: 'EnrollmentType.FLEXIBLE_COURSES' },
  { regex: /StudyPathway\.MODULAR/g, replacement: 'StudyPathway.FLEXIBLE_COURSES' },
  { regex: /ProgrammeChoice\.MODULAR/g, replacement: 'ProgrammeChoice.FLEXIBLE_COURSES' },
]

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    file = path.join(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else {
      if (EXTENSIONS.some((ext) => file.endsWith(ext))) {
        results.push(file)
      }
    }
  })
  return results
}

function processFiles() {
  const files = []
  DIRECTORIES.forEach((d) => {
    if (fs.existsSync(d)) {
      files.push(...walk(d))
    }
  })

  let changedCount = 0

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8')
    let originalContent = content

    REPLACEMENTS.forEach(({ regex, replacement }) => {
      content = content.replace(regex, replacement)
    })

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8')
      console.log(`Updated: ${file}`)
      changedCount++
    }
  })

  console.log(`Total files updated: ${changedCount}`)
}

processFiles()
