const fs = require('fs')
const content = fs.readFileSync('scripts/generate-api-tests.cjs', 'utf-8')
let depth = 0
let lineNum = 0
let inTemplate = false
let templateStartLine = 0

for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') {
    lineNum++
  }
  if (content[i] === '`') {
    // Check if this is an escaped backtick
    if (i > 0 && content[i-1] === '\\') continue
    depth++
    if (depth === 1 && !inTemplate) {
      inTemplate = true
      templateStartLine = lineNum + 1
    } else if (depth === 0) {
      inTemplate = false
    }
  }
}

console.log('Final backtick depth:', depth)
console.log('Currently in template:', inTemplate)
if (inTemplate) {
  console.log('Template started at line:', templateStartLine)
}
