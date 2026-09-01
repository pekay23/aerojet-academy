const c = require('fs').readFileSync('scripts/generate-api-tests.cjs','utf-8').split('\n')
let depth = 0
for (let i = 0; i < c.length; i++) {
  const line = c[i]
  // Count backticks, ignoring escaped ones
  let bt = 0
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '`' && line[j-1] !== '\\') bt++
  }
  // Count ${ } - each ${ starts a nested context, each } closes one (if at depth)
  let inSub = 0
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '$' && j+1 < line.length && line[j+1] === '{') inSub++
  }
  if (bt > 0) {
    console.log(`Line ${i+1}: backticks=${bt} ${line.substring(0, 100)}`)
  }
}
