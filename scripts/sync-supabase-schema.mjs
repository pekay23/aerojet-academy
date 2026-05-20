#!/usr/bin/env node
// Sync Prisma schema to Supabase backup database.
// Usage: npm run db:push:supabase
//
// Temporarily overrides DATABASE_URL so that `prisma db push`
// targets the Supabase database instead of Neon.

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load SUPABASE_DATABASE_URL from .env.local if present
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^SUPABASE_DATABASE_URL=(.+)$/);
    if (match) {
      process.env.SUPABASE_DATABASE_URL = match[1].replace(/^["']|["']$/g, "");
    }
  }
}

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
if (!supabaseUrl) {
  console.error("ERROR: SUPABASE_DATABASE_URL is not set.");
  console.error(
    "Set it in .env.local or export it before running this script."
  );
  process.exit(1);
}

console.log("Pushing Prisma schema to Supabase...");
console.log(`Target: ${supabaseUrl.split("@")[0]}@****`);

// Append sslmode=require if not already present
let pushUrl = supabaseUrl;
if (!pushUrl.includes("sslmode=")) {
  pushUrl += pushUrl.includes("?") ? "&sslmode=require" : "?sslmode=require";
}

// Prisma db push does DDL (CREATE TABLE, ALTER) which requires the session
// pooler (port 5432), not the transaction pooler (port 6543).
pushUrl = pushUrl.replace(":6543/", ":5432/");

execSync("npx prisma db push --accept-data-loss", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: pushUrl, DIRECT_URL: pushUrl },
});

console.log("");
console.log("Done. Supabase tables now match prisma/schema.prisma.");
