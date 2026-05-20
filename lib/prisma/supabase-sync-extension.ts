import 'server-only'
import { Prisma } from '@prisma/client'
import { isBackupEnabled } from '@/lib/supabase/client'
import { transformForSupabase, BACKUP_MODELS } from '@/lib/supabase/dual-write'
import { getSupabasePrismaClient } from '@/lib/supabase/dual-write'

/**
 * Prisma Extension for real-time synchronization to Supabase.
 * Hooks into create, update, delete, and upsert operations.
 */
export const supabaseSyncExtension = () => Prisma.defineExtension({
  name: 'supabaseSyncExtension',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Execute the operation in the primary DB (Neon) first
        const result = await query(args)

        // Non-blocking sync if backup is enabled
        if (model && isBackupEnabled()) {
          const modelKey = model.charAt(0).toLowerCase() + model.slice(1)

          // Only sync if the model is part of BACKUP_MODELS
          if (BACKUP_MODELS.includes(modelKey as any)) {
            setTimeout(async () => {
              try {
                const supabase = await getSupabasePrismaClient()
                if (!supabase) return

                const supabaseModel = (supabase as any)[modelKey]
                if (!supabaseModel) return

                const transformed = result ? transformForSupabase(result) as any : null

                if (operation === 'create' || operation === 'update' || operation === 'upsert') {
                  if (transformed && transformed.id) {
                    await supabaseModel.upsert({
                      where: { id: transformed.id },
                      create: transformed,
                      update: transformed,
                    })
                  }
                } else if (operation === 'delete') {
                  if (transformed && transformed.id) {
                    await supabaseModel.delete({
                      where: { id: transformed.id },
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
