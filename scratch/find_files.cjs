const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchDir(fullPath, query);
      } else if (stat.isFile()) {
        const content = fs.readFileSync(fullPath);
        if (content.includes(query)) {
          console.log(`Found "${query}" in file: ${fullPath} (size: ${stat.size} bytes)`);
        }
      }
    } catch (e) {
      // ignore errors for binary files or permissions
    }
  }
}

const baseDir = 'C:\\Users\\PC\\.gemini\\antigravity';
console.log("Searching in:", baseDir);
searchDir(baseDir, 'HeroSlider');
searchDir(baseDir, 'minimalist');
console.log("Search finished.");
