/**
 * Fixes the @typescript/typescript6 shim to expose a `tsc` bin entry.
 * Next.js 16+ requires `typescript/bin/tsc` to be present, but the shim
 * package only ships `tsc6`. This script patches the installed shim's
 * package.json and creates a `bin/tsc` shim after every `bun install`.
 *
 * Safe to run repeatedly — idempotent.
 *
 * The shim's `lib/tsc.js` is a stub that delegates to `@typescript/old/lib/tsc.js`,
 * which is the real TypeScript 6 compiler. We copy `bin/tsc6` to `bin/tsc`
 * to satisfy Next.js's `typescript/bin/tsc` file existence check.
 */

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { realpathSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Resolve the actual typescript package location (follows the npm: alias)
const tsSymlink = join(rootDir, 'node_modules', 'typescript', 'package.json');
if (!existsSync(tsSymlink)) {
  console.warn('[fix-tsc6-shim] node_modules/typescript not found — skipping');
  process.exit(0);
}

const shimDir = dirname(realpathSync(tsSymlink));
const shimBinDir = join(shimDir, 'bin');
const binTsc = join(shimBinDir, 'tsc');
const binTsc6 = join(shimBinDir, 'tsc6');

// 1. Ensure bin/tsc exists by copying from bin/tsc6
if (existsSync(binTsc6)) {
  if (!existsSync(binTsc)) {
    copyFileSync(binTsc6, binTsc);
    console.log('[fix-tsc6-shim] Created bin/tsc from bin/tsc6');
  } else {
    // Verify the content still matches (in case bun install changed tsc6)
    const current = readFileSync(binTsc, 'utf8');
    const expected = readFileSync(binTsc6, 'utf8');
    if (current !== expected) {
      copyFileSync(binTsc6, binTsc);
      console.log('[fix-tsc6-shim] Updated bin/tsc to match bin/tsc6');
    }
  }
} else if (existsSync(binTsc)) {
  // tsc6 missing but tsc exists — leave as-is
  console.log('[fix-tsc6-shim] bin/tsc6 not found, bin/tsc present — skipping');
} else {
  // Neither exists — create a direct delegation to @typescript/old
  const tscShim = '#!/usr/bin/env node\nrequire("@typescript/old/lib/tsc.js")\n';
  writeFileSync(binTsc, tscShim);
  console.log('[fix-tsc6-shim] Created bin/tsc with direct @typescript/old delegation');
}

// 2. Patch package.json to declare tsc bin (so it survives Next.js's exportsRestrict check)
const pkgJsonPath = join(shimDir, 'package.json');
const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
pkgJson.bin = pkgJson.bin || {};

if (!pkgJson.bin.tsc) {
  pkgJson.bin.tsc = './bin/tsc';
  writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
  console.log('[fix-tsc6-shim] Patched package.json bin.tsc');
}

console.log('[fix-tsc6-shim] Done');


