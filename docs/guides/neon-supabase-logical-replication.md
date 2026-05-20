# Neon → Supabase Logical Replication Runbook

**Status**: Manual one-time DB setup required on both Neon and Supabase. The
application code (this repo) does **not** perform dual-writes — replication is
handled entirely at the Postgres layer.

---

## ⚡ TL;DR — 8 steps from zero to replicating

If you've read the rest of this doc and just want the checklist:

1. **Neon → Project → Settings → Beta features → toggle Logical replication** (compute restarts ~30s).
2. On Neon (as `neondb_owner`):
   ```sql
   CREATE PUBLICATION aerojet_pub FOR ALL TABLES;
   ```
3. On Neon, create a dedicated replication role:
   ```sql
   CREATE ROLE neondb_replicator WITH REPLICATION LOGIN PASSWORD 'use-a-strong-random-string';
   GRANT USAGE ON SCHEMA public TO neondb_replicator;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO neondb_replicator;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO neondb_replicator;
   ```
   Store the password in your secret manager — you'll need it in step 6.
4. Mirror the schema to Supabase **before** the subscription exists:
   ```bash
   bun run db:push:supabase
   ```
   This empties the Supabase tables and re-creates them to match Prisma. Skip
   if you already pushed and tables are empty.
5. On Supabase **SQL Editor** (Project → Database → Extensions), confirm
   `pg_subscription` capability is available (paid tier required for inbound
   logical replication on Supabase too).
6. Still on Supabase, create the subscription:
   ```sql
   CREATE SUBSCRIPTION aerojet_sub
     CONNECTION 'host=ep-XXXX.us-east-1.aws.neon.tech
                 port=5432
                 user=neondb_replicator
                 password=<from step 3>
                 dbname=neondb
                 sslmode=require'
     PUBLICATION aerojet_pub
     WITH (copy_data = true, create_slot = true, slot_name = 'aerojet_sub_slot', streaming = on);
   ```
   The initial copy may take a few minutes for large tables — watch progress
   with `SELECT * FROM pg_stat_subscription;`.
7. In **Vercel → Project → Settings → Environment Variables**, add:
   - `SUPABASE_DATABASE_URL` — the Supabase pooler connection string (used by
     `bun run db:push:supabase` via `postdb:push`).
   - `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` if not already.
8. Verify the weekly sync-check cron is live in `vercel.json` — schedule
   `0 4 * * 1`. It pings `lib/supabase/sync-check.ts:runSyncCheck()` and
   writes an AuditLog row if drift > 0.1%.

**You're done.** Every Prisma write on Neon now replicates to Supabase
typically within a second. Schema changes still flow via `bun run db:push`
(which triggers `postdb:push` → `db:push:supabase` automatically).

---

## What this gives you

- **Row-level** replication of every Aerojet table from Neon → Supabase
  in near real-time (typical lag <1s).
- Supabase becomes a live read-replica suitable for:
  - Analytics queries that should not hit the primary
  - Disaster-recovery cutover (if Neon becomes unreachable)
  - Storage parity for the Document Vault (which lives in Supabase buckets)
- Schema mirroring is **separate** and handled by `bun run db:push` (which now
  triggers `bun run db:push:supabase` automatically via the `postdb:push` hook).

## What this does NOT give you

- Bi-directional sync. Supabase is read-only from the app's perspective.
- Conflict resolution. Writes must always go through Neon (via Prisma).
- Storage-bucket replication. The `aerojet-documents` bucket is Supabase-native;
  UploadThing → Supabase mirroring is handled by
  `app/api/cron/supabase-mirror/route.ts` (separate concern).

---

## Step 1 — Enable logical decoding on Neon

Neon supports `wal_level=logical` on **paid tiers**. Free tier requires upgrade.

1. Open the Neon Console → Project → **Settings → Beta features**.
2. Toggle **Logical replication** ON. Neon will restart the compute (≈30s).
3. Verify in `psql`:

   ```sql
   SHOW wal_level;            -- expect: logical
   SHOW max_replication_slots; -- expect: >= 10
   SHOW max_wal_senders;       -- expect: >= 10
   ```

## Step 2 — Create the publication on Neon

Connect to Neon as `neondb_owner` (or any role with `CREATE` on the schema):

```sql
-- One publication covering every Aerojet table.
CREATE PUBLICATION aerojet_pub FOR ALL TABLES;

-- Verify
SELECT pubname, puballtables FROM pg_publication;
```

If you prefer a curated list (e.g. exclude `_prisma_migrations`):

```sql
CREATE PUBLICATION aerojet_pub
  FOR TABLE users, profiles, enrollments, payments, /* … */ ;
```

Use the all-tables form unless you have a reason — it survives schema additions
without manual ALTER PUBLICATION.

## Step 3 — Prepare Supabase as the subscriber

1. Make sure schema is mirrored first. Run on a dev machine:

   ```bash
   bun run db:push:supabase
   ```

   This script (`scripts/sync-supabase-schema.sh`) temporarily redirects
   `DATABASE_URL` to `SUPABASE_DATABASE_URL` and runs `prisma db push
   --accept-data-loss` against Supabase. Required because logical replication
   replicates **data only**, not DDL.

2. On Supabase, the destination tables must be empty (or already match the
   source) before subscription. For a fresh setup, the `db:push:supabase`
   above creates empty tables and you can proceed.

3. Open Supabase **SQL Editor** and run:

   ```sql
   -- Replace placeholders before running
   CREATE SUBSCRIPTION aerojet_sub
     CONNECTION 'host=ep-XXXX.us-east-1.aws.neon.tech
                 port=5432
                 user=neondb_replicator
                 password=<see 1Password>
                 dbname=neondb
                 sslmode=require'
     PUBLICATION aerojet_pub
     WITH (
       copy_data = true,
       create_slot = true,
       slot_name = 'aerojet_sub_slot',
       streaming = on
     );

   -- Verify
   SELECT subname, subenabled, subslotname FROM pg_subscription;
   ```

   **Connection user**: create a dedicated `neondb_replicator` role on Neon
   with `REPLICATION` permission and `SELECT` on all tables. Storing its
   password in Supabase pg_subscription is acceptable for managed Postgres,
   but keep a copy in 1Password.

## Step 4 — Monitor

On **Neon**:

```sql
SELECT slot_name, active, restart_lsn, confirmed_flush_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS lag
  FROM pg_replication_slots
 WHERE slot_name = 'aerojet_sub_slot';
```

Lag should stay near zero. If it grows unbounded, Neon is retaining WAL —
investigate (subscriber unreachable, network issue, schema drift).

On **Supabase**:

```sql
SELECT subname, received_lsn, latest_end_lsn, latest_end_time
  FROM pg_stat_subscription;
```

The app's `/api/cron/sync-check` route (weekly Mondays at 04:00 UTC) calls
`lib/supabase/sync-check.ts:runSyncCheck()` which counts rows on both ends for
a key set of tables (User, Enrollment, Payment, AuditLog, Grade) and writes
an AuditLog row if drift exceeds 0.1%. Wire to PagerDuty / email via the
existing notification helpers.

## Step 5 — Schema changes after replication is live

Schema DDL is **NOT** replicated. The flow:

1. Edit `prisma/schema.prisma`.
2. `bun run db:push` → applies to Neon, then `postdb:push` automatically runs
   `db:push:supabase` against Supabase.
3. If you added a table, refresh the publication on Neon:

   ```sql
   -- Only needed if your publication is NOT "FOR ALL TABLES"
   ALTER PUBLICATION aerojet_pub ADD TABLE new_table_name;
   ```

   The all-tables form picks up new tables automatically on next subscription
   refresh.

4. On Supabase, refresh the subscription so it knows about new tables:

   ```sql
   ALTER SUBSCRIPTION aerojet_sub REFRESH PUBLICATION;
   ```

## Step 6 — Disaster recovery cutover (read path only)

If Neon is down and you need Supabase to serve reads:

1. Set `DATABASE_URL=$SUPABASE_DATABASE_URL` in Vercel env.
2. Redeploy. Writes will fail (intentionally — Supabase is read-only in this
   setup) but reads will continue.
3. Once Neon is back, set `DATABASE_URL` back, redeploy, then re-run
   `bun run db:push:supabase` if any schema changes happened during the
   outage.

For full failover (writes too), see `docs/disaster-recovery.md` (not yet
written — TODO).

---

## Why we chose this over app-level dual-write

- **Correctness**: dual-write requires distributed transactions or eventual
  consistency tooling. Logical replication is built into Postgres and
  battle-tested.
- **Performance**: zero overhead on the app server (no second `await` per
  query, no thread fan-out).
- **Schema parity**: `prisma db push` is the single source of truth.
- **Operational simplicity**: monitoring is `pg_replication_slots`, not custom
  app metrics.

The dormant `lib/supabase/dual-write.ts` and
`lib/prisma/supabase-sync-extension.ts` modules are kept in the tree as a
**fallback strategy** if logical replication is unavailable (e.g. Neon free
tier). They have zero callers today and should stay that way once replication
is healthy.

---

## Realtime push notifications (in-app messaging)

The in-app messages inbox subscribes to Supabase Realtime so new messages
arrive without a page refresh. This piggybacks on the logical-replication
data stream above — once a message row lands in Supabase, the Realtime
service emits a `postgres_changes` event that the browser hook picks up.

### Enabling Realtime on the `messages` table

In current Supabase dashboards the Realtime toggle lives under **Database → Tables**, not under the Replication tab (the Replication tab is for the inbound logical-replication subscription described above, not for the outbound websocket stream).

1. Open Supabase → **Database → Tables**.
2. Click the `messages` row.
3. Toggle **Enable Realtime** in the table-settings panel.
4. (Optional) Repeat for `notifications` if you want push for in-app notifications too.

That's it — no app code changes needed.

### Client wiring (already in this repo)

- `lib/realtime/client.ts` — singleton `createBrowserClient` for Realtime only.
- `hooks/useRealtimeMessages.ts` — subscribes to `messages` filtered by `recipientId=eq.<currentUser.id>` (note: the column is camelCase `recipientId`, matching the Prisma field — Postgres keeps field names verbatim because there's no `@map`). On insert, calls `router.refresh()` and shows a toast.
- `components/shared/MessagesRealtime.tsx` — UI-less mount point; drop in any messages page.

Dropped into both `app/student/messages/page.tsx` and `app/staff/messages/page.tsx` already. Existing `AutoRefresh` polling remains as a fallback when Supabase isn't reachable.

### Falling back gracefully

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset (e.g. CI), `getRealtimeClient()` returns `null` and the hook becomes a no-op. The 20–60s `AutoRefresh` polling continues to work, so no user-visible regression.
