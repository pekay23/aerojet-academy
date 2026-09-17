import 'server-only'
import { Prisma } from '@prisma/client'
import { isBackupEnabled } from '@/lib/supabase/client'
import { transformForSupabase, BACKUP_MODELS } from '@/lib/supabase/dual-write'
import { getSupabasePrismaClient } from '@/lib/supabase/dual-write'

interface SupabaseModelLike {
  upsert(args: { where: { id: string }; create: Record<string, unknown>; update: Record<string, unknown> }): Promise<unknown>
  delete(args: { where: { id: string } }): Promise<unknown>
}

export const supabaseSyncExtension = () => Prisma.defineExtension({
  name: 'supabaseSyncExtension',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args)

        if (model && isBackupEnabled()) {
          const modelKey = ((model as string).charAt(0).toLowerCase() + (model as string).slice(1)) as string

          if ((BACKUP_MODELS as readonly string[]).includes(modelKey)) {
            setTimeout(async () => {
              try {
                const supabase = await getSupabasePrismaClient()
                if (!supabase) return

                const supabaseModel = (supabase as Record<string, Record<string, unknown>>)[modelKey]
                if (!supabaseModel) return

                const transformed = result ? (transformForSupabase(result) as unknown as Record<string, unknown>) : null

                if (operation === 'create' || operation === 'update' || operation === 'upsert') {
                  if (transformed && transformed.id) {
                    await (supabaseModel as unknown as SupabaseModelLike).upsert({
                      where: { id: transformed.id as string },
                      create: transformed,
                      update: transformed,
                    })
                  }
                } else if (operation === 'delete') {
                  if (transformed && transformed.id) {
                    await (supabaseModel as unknown as SupabaseModelLike).delete({
                      where: { id: transformed.id as string },
                    }).catch(() => {})
                  }
                }
              } catch (error) {
                console.error(`[Supabase Sync Extension Error] failed for ${model}/${operation}:`, error)
              }
            }, 0)
          }
        }

        return result
      },
    },
  },
})
