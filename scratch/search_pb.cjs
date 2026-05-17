const fs = require('fs');
const path = require('path');

const pbPath = 'C:\\Users\\PC\\.gemini\\antigravity\\conversations\\02b30efc-32c9-4e0c-a287-7ff201198bc2.pb';
if (!fs.existsSync(pbPath)) {
  console.error("PB file does not exist at path:", pbPath);
  process.exit(1);
}

const content = fs.readFileSync(pbPath);
console.log("Binary file size:", content.length);

// Extract all continuous sequences of printable ASCII characters of length >= 10
let strings = [];
let current = '';

for (let i = 0; i < content.length; i++) {
  const byte = content[i];
  // Printable ASCII chars or basic spacing (space, tab, newline)
  if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
    current += String.fromCharCode(byte);
  } else {
    if (current.trim().length >= 10) {
      strings.push(current.trim());
    }
    current = '';
  }
}
if (current.trim().length >= 10) {
  strings.push(current.trim());
}

fs.writeFileSync('scratch/pb_strings.txt', strings.join('\n\n=========================================\n\n'), 'utf8');
console.log(`Extracted ${strings.length} strings of length >= 10 into scratch/pb_strings.txt`);
