const fs = require('fs');
const path = require('path');

const pbPath = 'C:\\Users\\PC\\.gemini\\antigravity\\conversations\\02b30efc-32c9-4e0c-a287-7ff201198bc2.pb';
if (!fs.existsSync(pbPath)) {
  console.error("PB file does not exist at path:", pbPath);
  process.exit(1);
}

const content = fs.readFileSync(pbPath);
console.log("Read binary file size:", content.length);

let printable = '';
for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if ((char >= 32 && char <= 126) || char === 10 || char === 13 || char === 9) {
    printable += String.fromCharCode(char);
  } else {
    printable += ' ';
  }
}

// Clean up consecutive spaces
printable = printable.replace(/ {2,}/g, ' ');

fs.writeFileSync('scratch/extracted_pb.txt', printable, 'utf8');
console.log("Done extracting! Output saved to scratch/extracted_pb.txt");
