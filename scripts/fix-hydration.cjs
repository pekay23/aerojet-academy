const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./app');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes("'use client'") && !content.includes('"use client"')) return;
  
  const lines = content.split('\n');
  let newLines = [];
  let fileModified = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('.toLocaleDateString(') && !line.includes('en-GB') && !line.includes('en-US')) {
      // Replace new Date(xxx).toLocaleDateString(...) -> formatDate(xxx)
      let oldLine = line;
      line = line.replace(/new Date\(([^)]+)\)\.toLocaleDateString\((?:undefined\s*(?:,\s*\{[^}]+\})?)?\)/g, 'formatDate($1)');
      // Replace xxx.toLocaleDateString(...) -> formatDate(xxx)
      line = line.replace(/([a-zA-Z0-9_?.\[\]]+)\.toLocaleDateString\((?:undefined\s*(?:,\s*\{[^}]+\})?)?\)/g, 'formatDate($1)');
      
      // Specifically target empty bracket `([])`
      line = line.replace(/new Date\(([^)]+)\)\.toLocaleDateString\(\[\](?:,\s*\{[^}]+\})?\)/g, 'formatDate($1)');
      line = line.replace(/([a-zA-Z0-9_?.\[\]]+)\.toLocaleDateString\(\[\](?:,\s*\{[^}]+\})?\)/g, 'formatDate($1)');

      if (line !== oldLine) {
        fileModified = true;
      }
    }
    newLines.push(line);
  }
  
  if (fileModified) {
    let finalContent = newLines.join('\n');
    // We also need to add the import if it's not already there
    if (!finalContent.includes('formatDate(')) {
       // if we didn't actually replace anything but regex thought it did, skip
       if (!fileModified) return;
    }

    if (!finalContent.includes("import { formatDate }") && !finalContent.includes("import { formatDate,")) {
      const importStmt = "import { formatDate } from '@/lib/utils/formatters'\n";
      const useClientIdx = finalContent.indexOf('use client');
      if (useClientIdx !== -1) {
        // Find the end of the use client line
        const endOfLine = finalContent.indexOf('\n', useClientIdx);
        finalContent = finalContent.slice(0, endOfLine + 1) + importStmt + finalContent.slice(endOfLine + 1);
      } else {
        finalContent = importStmt + finalContent;
      }
    }
    fs.writeFileSync(file, finalContent, 'utf8');
    modifiedCount++;
    console.log('Fixed ' + file);
  }
});
console.log('Total files modified: ' + modifiedCount);
