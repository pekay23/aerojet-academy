const fs = require('fs')
const content = fs.readFileSync('scripts/generate-api-tests.cjs', 'utf-8')

// More accurate backtick tracking with ${} awareness
let i = 0
let depth = 0
let lineNum = 1
let stack = []

while (i < content.length) {
  const ch = content[i]
  
  if (ch === '\n') {
    lineNum++
    i++
    continue
  }
  
  if (ch === '\\') {
    i += 2 // skip escaped character
    continue
  }
  
  if (ch === '`') {
    if (depth === 0) {
      // Opening a new template literal
      depth = 1
      stack.push({ type: 'template', line: lineNum })
    } else {
      // This might be closing a template literal or opening a nested one
      // Check context: if we're inside ${...}, this backtick opens/closes a nested template
      depth--
      if (depth > 0) {
        // We were inside ${...}, so this backtick opened/closed a nested template
        // The ${...} adds to depth, backtick adds/subtracts
      }
    }
    i++
    continue
  }
  
  if (ch === '$' && content[i+1] === '{') {
    depth++
    stack.push({ type: '${', line: lineNum })
    i += 2
    continue
  }
  
  if (ch === '}') {
    if (stack.length > 0 && stack[stack.length-1].type === '${') {
      stack.pop()
      depth--
    }
    i++
    continue
  }
  
  i++
}

console.log('Final depth:', depth)
console.log('Stack:', JSON.stringify(stack))
if (stack.length > 0) {
  console.log('Unclosed at:', stack[stack.length-1])
}
