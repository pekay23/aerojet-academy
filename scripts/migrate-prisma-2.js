const fs = require('fs');
const path = require('path');

const root = 'C:\\Projects\\aerojet-academy';
const dirs = ['scripts', 'scratch', 'prisma'];

let updated = 0;

for (const dir of dirs) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) continue;

  const entries = fs.readdirSync(base, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;

    const fullPath = path.join(entry.parentPath || base, entry.name);
    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes('import prisma from') && content.includes('lib/prisma/client')) {
      content = content
        .replace(/import prisma from ['"]\.{1,2}\/lib\/prisma\/client['"]/g, "import { prismaUnfiltered } from '@/lib/prisma/client'")
        .replace(/\bprisma\./g, 'prismaUnfiltered.');
      fs.writeFileSync(fullPath, content);
      console.log('Updated: ' + fullPath.slice(root.length + 1));
      updated++;
    }
  }
}

console.log('\nTotal files updated: ' + updated);
