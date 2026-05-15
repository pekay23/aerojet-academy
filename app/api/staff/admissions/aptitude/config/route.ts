import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { getAptitudeConfig, updateSystemSetting } from '@/lib/settings'

// GET /api/staff/admissions/aptitude/config
export const GET = withErrorHandler(async () => {
  await requireStaff()
  const config = await getAptitudeConfig()
  return apiSuccess(config)
})

// PUT /api/staff/admissions/aptitude/config
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const body = await req.json()
  
  // We save all values to SystemSetting
  const stringUpdates = [
    'aptitude_time_limit_minutes',
    'aptitude_pass_threshold_pct',
    'aptitude_math_count',
    'aptitude_english_count',
    'aptitude_engineering_count',
    'aptitude_reasoning_count',
    'aptitude_physics_count',
    'aptitude_max_tab_switches',
  ]
  const booleanUpdates = [
    'aptitude_require_for_modular',
    'aptitude_shuffle_questions',
    'aptitude_shuffle_options',
  ]

  for (const key of stringUpdates) {
    if (body[key] !== undefined) {
      await updateSystemSetting(key, String(body[key]), 'NUMBER')
    }
  }

  for (const key of booleanUpdates) {
    if (body[key] !== undefined) {
      await updateSystemSetting(key, String(body[key]), 'BOOLEAN')
    }
  }

  return apiSuccess({ updated: true })
})
