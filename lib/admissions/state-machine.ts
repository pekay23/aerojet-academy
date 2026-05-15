import { ApplicationStage, Prisma, ProgrammeChoice } from '@prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { logAuditEvent } from '@/lib/audit/logger'
import { getSystemSetting, getSystemSettings } from '@/lib/settings'
import {
  ALLOWED_TRANSITIONS,
  DEFAULT_PIPELINE_STAGE_CONFIG,
  type PipelineStageConfig,
} from './constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransitionResult {
  success: boolean
  application: {
    id: string
    stage: ApplicationStage
    previousStage: ApplicationStage | null
  } | null
  error?: string
  autoTransitioned?: boolean
}

interface TransitionOptions {
  metadata?: Prisma.InputJsonValue
  skipAutoTransition?: boolean
  rejectionReason?: string
}

// ---------------------------------------------------------------------------
// Pipeline stage config helpers
// ---------------------------------------------------------------------------

export async function getPipelineStageConfig(
  programme: ProgrammeChoice
): Promise<PipelineStageConfig> {
  const raw = await getSystemSetting('pipeline_stage_config', '')
  const featureFlags = await getSystemSettings([
    'document_uploads_enabled',
    'aptitude_test_enabled',
    'interview_system_enabled',
    'medical_review_enabled',
  ])

  let baseConfig: PipelineStageConfig
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed[programme]) {
        baseConfig = parsed[programme] as PipelineStageConfig
      } else {
        baseConfig = DEFAULT_PIPELINE_STAGE_CONFIG[programme] ?? DEFAULT_PIPELINE_STAGE_CONFIG.MODULAR
      }
    } catch {
      baseConfig = DEFAULT_PIPELINE_STAGE_CONFIG[programme] ?? DEFAULT_PIPELINE_STAGE_CONFIG.MODULAR
    }
  } else {
    baseConfig = DEFAULT_PIPELINE_STAGE_CONFIG[programme] ?? DEFAULT_PIPELINE_STAGE_CONFIG.MODULAR
  }

  return {
    documents: baseConfig.documents && featureFlags.get('document_uploads_enabled') === 'true',
    aptitude: baseConfig.aptitude && featureFlags.get('aptitude_test_enabled') === 'true',
    shortlisting: baseConfig.shortlisting,
    interview: baseConfig.interview && featureFlags.get('interview_system_enabled') === 'true',
    medical: baseConfig.medical && featureFlags.get('medical_review_enabled') === 'true',
  }
}

export async function isPipelineEnabled(): Promise<boolean> {
  const value = await getSystemSetting('admissions_pipeline_enabled', 'false')
  return value === 'true'
}

// ---------------------------------------------------------------------------
// Core state machine
// ---------------------------------------------------------------------------

/**
 * Transitions an application to a new stage with validation, audit logging,
 * and automatic stage skipping based on programme config.
 */
export async function transitionApplication(
  applicationId: string,
  targetStage: ApplicationStage,
  actorId: string,
  options: TransitionOptions = {}
): Promise<TransitionResult> {
  const application = await prismaUnfiltered.application.findUnique({
    where: { id: applicationId },
    select: { id: true, stage: true, previousStage: true, programmeChoice: true, userId: true },
  })

  if (!application) {
    return { success: false, application: null, error: 'Application not found' }
  }

  const currentStage = application.stage

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[currentStage]
  if (!allowed?.includes(targetStage)) {
    return {
      success: false,
      application: null,
      error: `Cannot transition from ${currentStage} to ${targetStage}`,
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    stage: targetStage,
    previousStage: currentStage,
  }

  if (targetStage === ApplicationStage.REJECTED && options.rejectionReason) {
    updateData.rejectionReason = options.rejectionReason
  }

  // Execute transition in a transaction
  const updated = await prismaUnfiltered.$transaction(async (tx) => {
    const result = await tx.application.update({
      where: { id: applicationId },
      data: updateData,
      select: { id: true, stage: true, previousStage: true, programmeChoice: true },
    })

    // Create stage log entry
    await tx.applicationStageLog.create({
      data: {
        applicationId,
        fromStage: currentStage,
        toStage: targetStage,
        actorId,
        metadata: options.metadata ?? undefined,
      },
    })

    return result
  })

  // Audit log (non-blocking)
  logAuditEvent({
    userId: actorId,
    action: 'STAGE_TRANSITION',
    entity: 'Application',
    entityId: applicationId,
    description: `Pipeline: ${currentStage} → ${targetStage}`,
    changes: { from: currentStage, to: targetStage, metadata: options.metadata },
  }).catch(() => {})

  // Check for auto-transition (skip disabled stages)
  if (!options.skipAutoTransition) {
    const autoResult = await handleAutoTransition(updated.id, updated.stage, updated.programmeChoice, actorId)
    if (autoResult) {
      return { ...autoResult, autoTransitioned: true }
    }
  }

  return {
    success: true,
    application: {
      id: updated.id,
      stage: updated.stage,
      previousStage: updated.previousStage,
    },
  }
}

// ---------------------------------------------------------------------------
// Auto-transition — skips disabled stage groups
// ---------------------------------------------------------------------------

/**
 * When a stage is reached that belongs to a disabled group for the applicant's
 * programme, auto-transition to the next enabled stage.
 */
async function handleAutoTransition(
  applicationId: string,
  currentStage: ApplicationStage,
  programme: ProgrammeChoice,
  actorId: string
): Promise<TransitionResult | null> {
  const config = await getPipelineStageConfig(programme)

  const skipTarget = getSkipTarget(currentStage, config)
  if (!skipTarget) return null

  // Recursively transition (the target might also need skipping)
  return transitionApplication(applicationId, skipTarget, actorId, {
    metadata: { autoSkipped: true, reason: `Stage group disabled for ${programme}` },
  })
}

/**
 * Returns the stage to skip to if the current stage is in a disabled group,
 * or null if no skip is needed.
 */
function getSkipTarget(
  stage: ApplicationStage,
  config: PipelineStageConfig
): ApplicationStage | null {
  // Aptitude stages — skip to SHORTLISTED or next enabled
  if (!config.aptitude) {
    if (stage === ApplicationStage.APTITUDE_PENDING || stage === ApplicationStage.APTITUDE_COMPLETED) {
      if (config.shortlisting) return ApplicationStage.SHORTLISTED
      if (config.interview) return ApplicationStage.INTERVIEW_PENDING
      if (config.medical) return ApplicationStage.MEDICAL_PENDING
      return ApplicationStage.ENROLLED
    }
  }

  // Shortlisting — skip to interview or next enabled
  if (!config.shortlisting) {
    if (stage === ApplicationStage.SHORTLISTED) {
      if (config.interview) return ApplicationStage.INTERVIEW_PENDING
      if (config.medical) return ApplicationStage.MEDICAL_PENDING
      return ApplicationStage.ENROLLED
    }
  }

  // Interview stages — skip to medical or enrollment
  if (!config.interview) {
    if (
      stage === ApplicationStage.INTERVIEW_PENDING ||
      stage === ApplicationStage.INTERVIEW_SCHEDULED ||
      stage === ApplicationStage.INTERVIEW_COMPLETED ||
      stage === ApplicationStage.SELECTED
    ) {
      if (config.medical) return ApplicationStage.MEDICAL_PENDING
      return ApplicationStage.ENROLLED
    }
  }

  // Medical stages — skip to enrollment
  if (!config.medical) {
    if (
      stage === ApplicationStage.MEDICAL_PENDING ||
      stage === ApplicationStage.MEDICAL_SUBMITTED ||
      stage === ApplicationStage.MEDICAL_CLEARED
    ) {
      return ApplicationStage.ENROLLED
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/**
 * Get the next natural stage for an application based on its programme config.
 * Used by staff "advance" buttons to know what the next target should be.
 */
export async function getNextStage(
  currentStage: ApplicationStage,
  programme: ProgrammeChoice
): Promise<ApplicationStage | null> {
  const config = await getPipelineStageConfig(programme)

  const NATURAL_PROGRESSION: Record<ApplicationStage, ApplicationStage | null> = {
    REGISTERED: ApplicationStage.PAYMENT_PENDING,
    PAYMENT_PENDING: ApplicationStage.PAYMENT_SUBMITTED,
    PAYMENT_SUBMITTED: ApplicationStage.PAYMENT_VERIFIED,
    PAYMENT_VERIFIED: config.aptitude ? ApplicationStage.APTITUDE_PENDING
      : config.shortlisting ? ApplicationStage.SHORTLISTED
      : config.interview ? ApplicationStage.INTERVIEW_PENDING
      : config.medical ? ApplicationStage.MEDICAL_PENDING
      : ApplicationStage.ENROLLED,
    APTITUDE_PENDING: ApplicationStage.APTITUDE_COMPLETED,
    APTITUDE_COMPLETED: config.shortlisting ? ApplicationStage.SHORTLISTED
      : config.interview ? ApplicationStage.INTERVIEW_PENDING
      : config.medical ? ApplicationStage.MEDICAL_PENDING
      : ApplicationStage.ENROLLED,
    SHORTLISTED: config.interview ? ApplicationStage.INTERVIEW_PENDING
      : config.medical ? ApplicationStage.MEDICAL_PENDING
      : ApplicationStage.ENROLLED,
    INTERVIEW_PENDING: ApplicationStage.INTERVIEW_SCHEDULED,
    INTERVIEW_SCHEDULED: ApplicationStage.INTERVIEW_COMPLETED,
    INTERVIEW_COMPLETED: ApplicationStage.SELECTED,
    SELECTED: config.medical ? ApplicationStage.MEDICAL_PENDING : ApplicationStage.ENROLLED,
    MEDICAL_PENDING: ApplicationStage.MEDICAL_SUBMITTED,
    MEDICAL_SUBMITTED: ApplicationStage.MEDICAL_CLEARED,
    MEDICAL_CLEARED: ApplicationStage.ENROLLED,
    ENROLLED: null,
    REJECTED: null,
    WITHDRAWN: null,
  }

  return NATURAL_PROGRESSION[currentStage]
}

/**
 * Calculate pipeline progress as a percentage (0-100).
 */
export function calculateProgress(
  currentStage: ApplicationStage,
  activeStages: ApplicationStage[]
): number {
  if (currentStage === ApplicationStage.ENROLLED) return 100
  if (currentStage === ApplicationStage.REJECTED || currentStage === ApplicationStage.WITHDRAWN) return 0

  const idx = activeStages.indexOf(currentStage)
  if (idx === -1) return 0

  return Math.round((idx / (activeStages.length - 1)) * 100)
}
