/**
 * Seed script: creates the default certificate template from the current
 * hardcoded CertificateTemplate.tsx values.
 *
 * Run with:  bunx tsx prisma/seed-pdf-templates.ts
 * Or via:    bun run db:seed:pdf-templates
 *
 * Safe to re-run — uses upsert logic.
 * Uses dotenv to load DATABASE_URL from .env if present.
 */
import 'dotenv/config'
import { PrismaClient, PdfTemplateType, PdfTemplateStatus } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CERTIFICATE_TEMPLATE = {
  name: 'Default Certificate',
  slug: 'certificate-default',
  type: PdfTemplateType.CERTIFICATE,
  layout: 'default',
  status: PdfTemplateStatus.ACTIVE,
  isDefault: true,
  content: {
    title: 'Certificate of Completion',
    subtitle: 'This is to certify that',
    completionText:
      'has successfully completed the prescribed training and assessment requirements for',
    accreditationText:
      'Aerojet Aviation Training Academy is an EASA Part-147 Approved Maintenance Training Organisation. This certificate attests to the completion of the approved training programme and does not constitute an EASA Part-66 Aircraft Maintenance Licence.',
    signatureLabels: ['Training Manager', 'Academy Director'],
  },
  branding: undefined,
  numberFormat: 'CERT-{YYYY}-{SEQ:4}',
  lastSequence: 0,
  lastSequenceYear: new Date().getFullYear(),
  createdBy: undefined,
  updatedBy: undefined,
  clonedFromId: undefined,
}

async function main() {
  console.log('Seeding PDF templates...')

  const existing = await prisma.pdfTemplate.findUnique({
    where: { slug: 'certificate-default' },
  })

  if (existing) {
    console.log(`Default certificate template already exists (id: ${existing.id}). Skipping.`)
  } else {
    const created = await prisma.pdfTemplate.create({
      data: DEFAULT_CERTIFICATE_TEMPLATE,
    })
    console.log(`Created default certificate template (id: ${created.id})`)
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
