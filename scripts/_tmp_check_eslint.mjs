import nextCore from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const all = [...nextCore, ...nextTs]
console.log('Total config items:', all.length)
for (const [i, c] of all.entries()) {
  if (!c || typeof c !== 'object') {
    console.log(i, 'NOT_OBJECT', c)
    continue
  }
  const plugins = c.plugins ? Object.keys(c.plugins) : []
  const rules = c.rules ? Object.keys(c.rules).length : 0
  const lang = c.languageOptions ? `lang(${Object.keys(c.languageOptions).join(',')})` : ''
  const files = c.files ? `files=[${(Array.isArray(c.files) ? c.files : [c.files]).slice(0, 3).join(',')}]` : ''
  console.log(i, plugins.join(',') || '-', `rules=${rules}`, lang, files)
}


