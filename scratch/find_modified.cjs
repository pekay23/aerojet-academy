const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (stat.isFile()) {
        const mtime = stat.mtime;
        // Check if modified on May 16 or 17, 2026
        const dateStr = mtime.toISOString();
        if (dateStr.startsWith('2026-05-16') || dateStr.startsWith('2026-05-17')) {
          console.log(`${dateStr} - ${fullPath} (${stat.size} bytes)`);
        }
      }
    } catch (e) {}
  }
}

console.log("Scanning project workspace for files modified on May 16/17, 2026...");
scanDir('c:\\Projects\\aerojet-academy');
console.log("Finished scan.");
