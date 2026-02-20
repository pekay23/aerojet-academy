const fs = require('fs')
const path = require('path')

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(function (file) {
    file = dir + '/' + file
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else {
      if (file.endsWith('.tsx')) results.push(file)
    }
  })
  return results
}

const files = walk('./app')
let c = 0

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8')
  const old = content
  // Look for <h1 that has text-[#002a5c] but NOT dark:text-
  content = content.replace(
    /(<h1[^>]+text-\[#002a5c\])((?!dark:text-(?:white|blue)).*?)(>)/g,
    '$1 dark:text-white$2$3'
  )

  if (old !== content) {
    fs.writeFileSync(f, content, 'utf8')
    console.log('Fixed', f)
    c++
  }
}
console.log('Total fixed:', c)
