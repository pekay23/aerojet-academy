import prisma from '@/lib/prisma/client'
import { getStudentStatus } from '@/lib/access-control'

/**
 * Certificate / document release rules (audit gap 4c).
 *
 * Pathway codes resolved via getStudentStatus().effectiveCode:
 *   FULL_TIME_4Y, FULL_TIME_2Y, MILITARY_1Y, MODULAR, EXAM_ONLY
 *
 * Business rules (authoritative — provided by academy):
 *  - FT 2-year, Modular, Exam-Only, Military 1-year: official EASA certificates
 *    become available to download as soon as Admin/Staff uploads/links them.
 *  - FT 4-year (self-funded / sponsored): EASA exam certificates release after the
 *    FIRST HALF (2 years class work + exams). The remaining documents release after
 *    the SECOND HALF (OJT) when the full programme is complete, or earlier when an
 *    admin determines so (documentsReleased override).
 *  - Scholarship students (any pathway): do NOT receive official EASA certificates
 *    for completed exam modules until they finish the full programme AND serve their
 *    bond. They DO receive Academy-generated transcripts/scores for exams written,
 *    whenever uploaded by Admin/Staff.
 *  - Admin override: certificatesReleased / documentsReleased force-release
 *    regardless of the above ("or otherwise determined by admin").
 */

export type CertificateMode = 'OFFICIAL' | 'ACADEMY_TRANSCRIPT_ONLY'

export interface CertificateEligibility {
  /** Official EASA certificate cards (certificateUrl) may be shown/downloaded. */
  officialCertificatesAvailable: boolean
  /** Remaining FT-4Y second-half documents released. */
  documentsAvailable: boolean
  /** Academy-generated transcript / exam scores should be shown. */
  showAcademyTranscript: boolean
  mode: CertificateMode
  /** Human-readable explanation rendered in the student-facing banner. */
  reason: string
  pathwayCode: string | null
  fundingSource: 'SELF_FUNDED' | 'SCHOLARSHIP' | 'SPONSORED'
  isScholarship: boolean
}

const SCHOLARSHIP_REASON =
  'As a scholarship student, official EASA certificates for your completed modules are released once you have finished the full programme and served your bond. Your Academy transcript and exam scores below are available now and update as results are uploaded.'

export async function getCertificateEligibility(
  userId: string
): Promise<CertificateEligibility> {
  const [profile, ftEnrollment, status] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        fundingSource: true,
        graduationDate: true,
        certificatesReleased: true,
        documentsReleased: true,
        bondingContract: { select: { status: true } },
      },
    }),
    prisma.fullTimeEnrollment.findFirst({
      where: { studentId: userId },
      select: {
        status: true,
        currentYearNumber: true,
        ojtPeriods: { select: { status: true } },
      },
    }),
    getStudentStatus(userId),
  ])

  const fundingSource = profile?.fundingSource ?? 'SELF_FUNDED'
  const isScholarship = fundingSource === 'SCHOLARSHIP'
  const pathwayCode = status.effectiveCode ?? status.pathwayCode ?? null
  const certificatesReleased = profile?.certificatesReleased ?? false
  const documentsReleased = profile?.documentsReleased ?? false

  const ftStatus = ftEnrollment?.status
  const ojtComplete = (ftEnrollment?.ojtPeriods ?? []).some(
    (o) => o.status === 'VERIFIED' || o.status === 'COMPLETED'
  )
  const fullProgrammeComplete =
    ftStatus === 'COMPLETED' || ojtComplete || profile?.graduationDate != null

  const bondStatus = profile?.bondingContract?.status
  // No bond on record → nothing to serve. Otherwise must be FULFILLED.
  const bondServed = bondStatus == null || bondStatus === 'FULFILLED'

  // FT-4Y: first half = 2 years of class work + exams (entering year 3+), or
  // programme already marked complete, or admin force-released certificates.
  const firstHalfComplete =
    (ftEnrollment?.currentYearNumber ?? 1) > 2 ||
    ftStatus === 'COMPLETED' ||
    certificatesReleased

  // Scholarship gate applies regardless of pathway.
  if (isScholarship) {
    const officialAvailable =
      certificatesReleased || (fullProgrammeComplete && bondServed)
    return {
      officialCertificatesAvailable: officialAvailable,
      documentsAvailable: officialAvailable || documentsReleased,
      showAcademyTranscript: true,
      mode: officialAvailable ? 'OFFICIAL' : 'ACADEMY_TRANSCRIPT_ONLY',
      reason: officialAvailable
        ? 'Your official EASA certificates have been released. You can download them below.'
        : SCHOLARSHIP_REASON,
      pathwayCode,
      fundingSource,
      isScholarship,
    }
  }

  // Self-funded / sponsored FT 4-year: half-by-half release.
  if (pathwayCode === 'FULL_TIME_4Y') {
    return {
      officialCertificatesAvailable: firstHalfComplete,
      documentsAvailable: fullProgrammeComplete || documentsReleased,
      showAcademyTranscript: true,
      mode: firstHalfComplete ? 'OFFICIAL' : 'ACADEMY_TRANSCRIPT_ONLY',
      reason: firstHalfComplete
        ? fullProgrammeComplete || documentsReleased
          ? 'You have completed the programme — your EASA certificates and all remaining documents are available below.'
          : 'You have completed the first half of the programme. Your EASA exam certificates are available below; the remaining documents are issued after you complete the OJT (second half).'
        : 'Official EASA exam certificates for the 4-year programme are released after you complete the first half (2 years of class work and exams). Your Academy transcript and exam scores below are available now.',
      pathwayCode,
      fundingSource,
      isScholarship,
    }
  }

  // FT 2-year, Military 1-year, Modular, Exam-Only (self-funded / sponsored):
  // certificates available as soon as Admin/Staff uploads them.
  return {
    officialCertificatesAvailable: true,
    documentsAvailable: true,
    showAcademyTranscript: true,
    mode: 'OFFICIAL',
    reason:
      'Your certificates appear here as soon as the Academy uploads and links them after your results are confirmed.',
    pathwayCode,
    fundingSource,
    isScholarship,
  }
}
