const fs = require('fs');
const c = fs.readFileSync('node_modules/react-joyride/dist/index.mjs', 'utf8');
const m = c.match(/react-joyride__button[_\w-]*/g) || [];
console.log('Button classes:');
[...new Set(m)].sort().forEach(x => console.log(' ', x));

// Also search for "back", "next", "skip", "finish" buttons
const b = c.match(/button[\w_]*-?(back|next|skip|finish|primary|close)/gi) || [];
console.log('\nButton modifiers:');
[...new Set(b)].sort().forEach(x => console.log(' ', x));

// Check styles prop
const s = c.match(/styles[\w_]+\s*:/g) || [];
console.log('\nStyle keys:');
[...new Set(s)].slice(0, 20).forEach(x => console.log(' ', x));
