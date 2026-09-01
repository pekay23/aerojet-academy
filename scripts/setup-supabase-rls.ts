import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()
  console.log('Connected to Supabase')

  // Drop existing policies first
  const tables = [
    'internal_exam_sessions',
    'internal_exam_answers',
    'internal_exam_violations',
    'internal_exam_access_codes',
    'internal_exam_registrations',
    'internal_exam_bank_instructors',
    'internal_exam_class_schedules',
    'internal_exam_rule_overrides',
  ]

  for (const table of tables) {
    try {
      await client.query(`
        DO $$
        DECLARE r record;
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = $1) LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON public.$2', r.policyname, $2);
        END LOOP;
        $$;
      `, [table, table])
    } catch (e: any) {
      // ignore
    }
  }

  // Create RLS policies with quoted camelCase column names
  const policies = [
    // internal_exam_sessions
    {
      table: 'internal_exam_sessions',
      sql: `
        CREATE POLICY "Students can view own sessions" ON public.internal_exam_sessions
          FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);
        CREATE POLICY "Students can update own sessions" ON public.internal_exam_sessions
          FOR UPDATE TO authenticated USING ("studentId" = auth.uid()::text);
        CREATE POLICY "Instructors can view bank sessions" ON public.internal_exam_sessions
          FOR SELECT TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.internal_exam_bank_instructors bi
              WHERE bi."bankId" = internal_exam_sessions."bankId"
              AND bi."instructorId" = auth.uid()::text
            )
          );
      `,
    },
    // internal_exam_answers
    {
      table: 'internal_exam_answers',
      sql: `
        CREATE POLICY "Students can manage own answers" ON public.internal_exam_answers
          FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.internal_exam_sessions s
              WHERE s.id = internal_exam_answers."sessionId"
              AND s."studentId" = auth.uid()::text
            )
          );
      `,
    },
    // internal_exam_violations
    {
      table: 'internal_exam_violations',
      sql: `
        CREATE POLICY "Students can view own violations" ON public.internal_exam_violations
          FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);
        CREATE POLICY "Instructors can view bank violations" ON public.internal_exam_violations
          FOR SELECT TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.internal_exam_sessions s
              JOIN public.internal_exam_bank_instructors bi ON bi."bankId" = s."bankId"
              WHERE s.id = internal_exam_violations."sessionId"
              AND bi."instructorId" = auth.uid()::text
            )
          );
      `,
    },
    // internal_exam_access_codes
    {
      table: 'internal_exam_access_codes',
      sql: `
        CREATE POLICY "Students can use own access codes" ON public.internal_exam_access_codes
          FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Staff can manage access codes" ON public.internal_exam_access_codes
          FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.internal_exam_sessions s
              JOIN public.internal_exam_bank_instructors bi ON bi."bankId" = s."bankId"
              WHERE s.id = internal_exam_access_codes."sessionId"
              AND bi."instructorId" = auth.uid()::text
            )
          );
      `,
    },
    // internal_exam_registrations
    {
      table: 'internal_exam_registrations',
      sql: `
        CREATE POLICY "Students can manage own registrations" ON public.internal_exam_registrations
          FOR ALL TO authenticated USING ("userId" = auth.uid()::text);
      `,
    },
    // internal_exam_bank_instructors
    {
      table: 'internal_exam_bank_instructors',
      sql: `
        CREATE POLICY "Instructors can view own assignments" ON public.internal_exam_bank_instructors
          FOR SELECT TO authenticated USING ("instructorId" = auth.uid()::text);
        CREATE POLICY "Staff can manage bank instructors" ON public.internal_exam_bank_instructors
          FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.internal_exam_banks b
              WHERE b.id = internal_exam_bank_instructors."bankId"
              AND b.created_by_id = auth.uid()::text
            )
          );
      `,
    },
    // internal_exam_class_schedules
    {
      table: 'internal_exam_class_schedules',
      sql: `
        CREATE POLICY "Instructors can manage class schedules" ON public.internal_exam_class_schedules
          FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.internal_exam_bank_instructors bi
              WHERE bi."bankId" = internal_exam_class_schedules."bankId"
              AND bi."instructorId" = auth.uid()::text
            )
          );
      `,
    },
    // internal_exam_rule_overrides
    {
      table: 'internal_exam_rule_overrides',
      sql: `
        CREATE POLICY "Instructors can manage bank rules" ON public.internal_exam_rule_overrides
          FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.internal_exam_bank_instructors bi
              WHERE bi."bankId" = internal_exam_rule_overrides."bankId"
              AND bi."instructorId" = auth.uid()::text
            )
          );
      `,
    },
  ]

  for (const policy of policies) {
    try {
      await client.query(policy.sql)
      console.log(`✅ RLS policies created for ${policy.table}`)
    } catch (e: any) {
      console.log(`⚠️ ${policy.table}: ${e.message}`)
    }
  }

  await client.end()
  console.log('\nDone!')
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
