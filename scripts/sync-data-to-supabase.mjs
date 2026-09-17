#!/usr/bin/env node
/**
 * Sync all data from Neon (primary) to Supabase (backup).
 *
 * Usage:  npx dotenv-cli -e .env -e .env.local -- node scripts/sync-data-to-supabase.mjs
 *
 * Strategy: TRUNCATE all Supabase tables, then INSERT in FK dependency order.
 * Uses the `postgres` library for both connections.
 */

import postgres from "postgres";

// ── Config ──────────────────────────────────────────────────────────────────

const NEON_URL =
  process.env.LOCAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL;
const SUPA_URL = process.env.SUPABASE_DATABASE_URL;

if (!NEON_URL) {
  console.error("ERROR: DATABASE_URL / DIRECT_URL is not set.");
  process.exit(1);
}
if (!SUPA_URL) {
  console.error("ERROR: SUPABASE_DATABASE_URL is not set.");
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Neon → Supabase full data sync (auto-discover tables)");
  console.log("=========================================================\n");

  const neon = postgres(NEON_URL, { ssl: "require", connect_timeout: 15 });
  const supa = postgres(SUPA_URL, { ssl: "require", connect_timeout: 15 });

  // Verify connections
  try {
    const [neonRes] = await neon`SELECT NOW()`;
    console.log("✅ Connected to Neon:", neonRes.now);
  } catch (err) {
    console.error("❌ Failed to connect to Neon:", err.message);
    process.exit(1);
  }

  try {
    const [supaRes] = await supa`SELECT NOW()`;
    console.log("✅ Connected to Supabase:", supaRes.now);
  } catch (err) {
    console.error("❌ Failed to connect to Supabase:", err.message);
    await neon.end();
    process.exit(1);
  }

  // ── Discover all public tables in Neon ────────────────────────────────────
  const neonTables = await neon`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name`;
  const allTables = neonTables.map((r) => r.table_name)
    .filter((t) => t !== "_prisma_migrations"); // skip Prisma internal table

  console.log(`\n📋 Found ${allTables.length} tables in Neon\n`);

  // ── Step 1: Truncate ALL Supabase tables using CASCADE ────────────────────
  console.log("🗑  Truncating all Supabase tables...");
  // Build a single TRUNCATE ... CASCADE for all tables that exist in Supabase
  const supaTables = await supa`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name != '_prisma_migrations'`;
  const supaTableNames = supaTables.map((r) => r.table_name);

  if (supaTableNames.length > 0) {
    const tableList = supaTableNames.map((t) => `"${t}"`).join(", ");
    await supa.unsafe(`TRUNCATE TABLE ${tableList} CASCADE`);
  }
  console.log(`   Truncated ${supaTableNames.length} tables.\n`);

  // ── Step 2: Topological sort by FK dependencies ───────────────────────────
  // Get all FK dependencies from Neon
  const fkDeps = await neon`
    SELECT DISTINCT
      tc.table_name AS child,
      ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name != ccu.table_name`;

  // Build adjacency map
  const deps = new Map(); // child → Set<parent>
  for (const { child, parent } of fkDeps) {
    if (!deps.has(child)) deps.set(child, new Set());
    deps.get(child).add(parent);
  }

  // Topological sort (Kahn's algorithm)
  const sorted = [];
  const remaining = new Set(allTables);
  const visited = new Set();

  while (remaining.size > 0) {
    const batch = [];
    for (const table of remaining) {
      const parents = deps.get(table) || new Set();
      // All parents satisfied (already sorted or not in our set)?
      const allParentsSatisfied = [...parents].every(
        (p) => visited.has(p) || !remaining.has(p)
      );
      if (allParentsSatisfied) {
        batch.push(table);
      }
    }

    if (batch.length === 0) {
      // Circular dependency — just add remaining tables
      console.warn("⚠️  Circular FK dependency detected, adding remaining tables as-is");
      for (const t of remaining) sorted.push(t);
      break;
    }

    for (const t of batch) {
      sorted.push(t);
      visited.add(t);
      remaining.delete(t);
    }
  }

  console.log(`📦 Syncing ${sorted.length} tables in FK-safe order...\n`);

  // ── Step 3: Copy data table by table ──────────────────────────────────────
  let totalSynced = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalEmpty = 0;

  for (const table of sorted) {
    try {
      // Check if table exists in Supabase
      if (!supaTableNames.includes(table)) {
        console.log(`  ⏭  ${table} — not in Supabase, skipping`);
        totalSkipped++;
        continue;
      }

      // Read all rows from Neon
      const rows = await neon.unsafe(`SELECT * FROM "${table}"`);

      if (rows.length === 0) {
        totalEmpty++;
        continue;
      }

      // Get column names
      const cols = Object.keys(rows[0]);
      const colList = cols.map((c) => `"${c}"`).join(", ");

      // Batch insert
      const BATCH_SIZE = 100;
      let synced = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const values = [];
        const placeholders = [];

        for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
          const row = batch[rowIdx];
          const rowPlaceholders = [];
          for (let colIdx = 0; colIdx < cols.length; colIdx++) {
            values.push(row[cols[colIdx]]);
            rowPlaceholders.push(`$${rowIdx * cols.length + colIdx + 1}`);
          }
          placeholders.push(`(${rowPlaceholders.join(", ")})`);
        }

        const insertSql = `INSERT INTO "${table}" (${colList}) VALUES ${placeholders.join(", ")}`;
        await supa.unsafe(insertSql, values);
        synced += batch.length;
      }

      console.log(`  ✅ ${table} — ${synced} rows`);
      totalSynced += synced;
    } catch (err) {
      console.error(`  ❌ ${table} — ${err.message}`);
      totalFailed++;
    }
  }

  console.log("\n=========================================================");
  console.log(`✅ Synced:   ${totalSynced} rows`);
  console.log(`⬜ Empty:    ${totalEmpty} tables`);
  console.log(`⏭  Skipped:  ${totalSkipped} tables`);
  console.log(`❌ Failed:   ${totalFailed} tables`);

  await neon.end();
  await supa.end();

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});


