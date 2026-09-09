# PDF Template Editor & Signature Management

Build a staff-facing system for managing PDF templates, digital signatures, and document verification — integrated into the existing **Staff Settings → PDF Templates** tab.

## Scope

### Template Configuration (Data-Driven)

Staff can customize the **content** of each template (text fields, labels, descriptions, accreditation text, numbering format) through a form UI. The underlying React components remain the same — they become data-driven instead of hardcoded.

> [!IMPORTANT]
> **This is NOT a drag-and-drop layout builder.** Templates are pre-built React components. What staff can edit is the **text content, signatures, numbering, and branding** within each template. Creating a "new template" means cloning an existing configuration and customizing its content. New **layouts** require developer work.

### Signature Management

Staff can upload, manage, and assign signature images to template positions (e.g., "Training Manager", "Academy Director"). Signatures render as images above the signature line in PDFs. Signatures support expiry dates for role change tracking.

### Document Verification (QR Codes)

Every generated document gets a unique verification code and QR code embedded in the PDF. Anyone can scan the QR or visit a public URL to verify the document's authenticity — critical for an aviation training academy issuing EASA-adjacent credentials.

### Certificate Numbering

Configurable per-template numbering format (e.g., `CERT-{YYYY}-{SEQ:4}` → `CERT-2026-0089`). Sequence auto-increments per template type per year.

---

## Key Design Decisions

> [!WARNING]
> **Template Types**: 2 template layouts exist (Certificate, Transcript). New layouts require developer work. All **content** within layouts is editable by ADMIN/SUPER_ADMIN. Staff clone templates to create variations (e.g., "Certificate - B1.1", "Certificate - B2").

> [!IMPORTANT]
> **Signature Storage**: Signatures stored in Supabase Storage (`aerojet-documents/signatures/`) as PNG/JPG. Read at PDF generation time and embedded as base64 data URIs. No secondary approval required for uploads — admin uploads with the consent of the person whose signature is needed.

> [!IMPORTANT]
> **Per-Template Signatures**: Different templates can have different signers. The `PdfSignature` library is shared, but admin assigns specific signatures to specific positions per template via the join table. A single signature can be assigned to multiple templates.

> [!IMPORTANT]
> **Access Control**: All template and signature management actions (`saveTemplateAction`, `uploadSignatureAction`, `cloneTemplateAction`, etc.) require `ADMIN` or `SUPER_ADMIN` role. The staff settings UI for PDF Templates tab should also be gated at the layout/UI level.

> [!IMPORTANT]
> **QR Verification**: This creates a **public** verification route (`/verify/[code]`) that anyone can access without authentication. It only reveals: document type, recipient name, issue date, certificate number, and verification status. No sensitive academic data is exposed.

## Resolved Decisions

1. **Signature approval workflow?** — No secondary approval required. The uploading admin's authority is sufficient. Signature must be added with the consent of the person whose signature is needed.
2. **Per-student vs. global signatures?** — Different certificates can have different signers. The signature library is shared across templates, but admin assigns specific signatures to specific template positions on a per-template basis.
3. **QR code placement** — Bottom-right of the accreditation/disclaimer area, or an appropriate position within the layout. Template editors cannot change placement (it's a layout-level decision, not content).
4. **Access control** — Template editing, signature management, and all template actions restricted to `ADMIN` and `SUPER_ADMIN` only.
5. **Editable content** — All text content within templates is editable by ADMIN and SUPER_ADMIN: title, subtitle, completionText, accreditationText, signatureLabels, sectionHeaders, disclaimerText.

---

## Proposed Changes

### Database Schema

#### [NEW] `PdfTemplate` model — stores template configurations

```prisma
model PdfTemplate {
  id                String                @id @default(cuid())
  name              String                @unique  // "Default Certificate", "B1.1 Certificate"
  slug              String                @unique  // "certificate-default"
  type              PdfTemplateType                 // CERTIFICATE | TRANSCRIPT
  layout            String                @default("default")  // Which React component to use
  status            PdfTemplateStatus     @default(DRAFT)
  isDefault         Boolean               @default(false)
  content           Json                            // Editable text fields (see below)
  branding          Json?                           // Per-template overrides: logo, watermark, footer
  numberFormat      String?                         // e.g. "CERT-{YYYY}-{SEQ:4}"
  lastSequence      Int                   @default(0) // Auto-increment counter
  lastSequenceYear  Int?                            // Reset sequence each year
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  createdBy         String?
  updatedBy         String?
  clonedFromId      String?               // If cloned, link to source
  signatures        PdfTemplateSignature[]
  verifications     DocumentVerification[]

  @@index([type, isDefault])
  @@index([status])
  @@map("pdf_templates")
}

enum PdfTemplateType {
  CERTIFICATE
  TRANSCRIPT
}

enum PdfTemplateStatus {
  DRAFT       // Being configured, not usable for generation
  ACTIVE      // Available for document generation
  ARCHIVED    // Retired, kept for audit trail
}
```

**`content` JSON** — template-specific editable fields:

Certificate example:

```json
{
  "title": "Certificate of Completion",
  "subtitle": "This is to certify that",
  "completionText": "has successfully completed the approved training programme in",
  "accreditationText": "Aerojet Aviation Training Academy is an EASA Part-147 Approved Maintenance Training Organisation...",
  "signatureLabels": ["Training Manager", "Academy Director"]
}
```

Transcript example:

```json
{
  "sectionHeaders": {
    "studentInfo": "Student Information",
    "academicRecord": "Academic Record"
  },
  "disclaimerText": "This is an Academy-issued record. It is not an official EASA certificate...",
  "signatureLabels": ["Registrar"]
}
```

**`branding` JSON** — per-template overrides (falls back to global `pdf_*` system settings):

```json
{
  "logoUrl": "/images/logos/AATA_logo_hor_onWhite.png",
  "watermarkUrl": "/apple-touch-icon.png",
  "watermarkOpacity": 0.15,
  "footerText": "Small Engines Dept., ATTC\nKokomlemle, Accra — Ghana"
}
```

---

#### [NEW] `PdfSignature` model — uploaded signature images

```prisma
model PdfSignature {
  id          String                  @id @default(cuid())
  label       String                  // Role: "Training Manager", "Academy Director"
  signerName  String                  // Person: "Capt. John Doe"
  imageUrl    String                  // Supabase storage path
  isActive    Boolean                 @default(true)
  sortOrder   Int                     @default(0)
  expiresAt   DateTime?               // When this signature should be rotated
  createdAt   DateTime                @default(now())
  updatedAt   DateTime                @updatedAt
  uploadedBy  String?
  templates   PdfTemplateSignature[]

  @@map("pdf_signatures")
}
```

#### [NEW] `PdfTemplateSignature` join table

```prisma
model PdfTemplateSignature {
  id          String       @id @default(cuid())
  templateId  String
  signatureId String
  position    Int          @default(0)  // 0 = left slot, 1 = right slot
  template    PdfTemplate  @relation(fields: [templateId], references: [id], onDelete: Cascade)
  signature   PdfSignature @relation(fields: [signatureId], references: [id], onDelete: Cascade)

  @@unique([templateId, position])
  @@map("pdf_template_signatures")
}
```

#### [NEW] `DocumentVerification` model — QR verification records

```prisma
model DocumentVerification {
  id              String         @id @default(cuid())
  code            String         @unique  // Short unique code: "AJ-2026-A7X9K2"
  templateId      String?
  recipientName   String         // Who the document was issued to
  documentType    String         // "Certificate" | "Transcript"
  certificateNo   String?        // The formatted certificate number
  issueDate       DateTime
  metadata        Json?          // Any extra display fields for the verification page
  generatedBy     String?        // Staff member who generated
  createdAt       DateTime       @default(now())
  template        PdfTemplate?   @relation(fields: [templateId], references: [id])

  @@index([code])
  @@index([recipientName])
  @@map("document_verifications")
}
```

---

### Backend — Server Actions & Utilities

#### [NEW] `lib/pdf-templates.ts`

Core template logic:

- `getDefaultTemplate(type)` — fetch active default template for a type
- `getTemplateById(id)` — single template with signatures
- `listTemplates(filter?)` — all templates for the settings UI
- `cloneTemplate(sourceId, newName)` — duplicate with new name/slug
- `getNextCertificateNumber(template)` — auto-increment sequence, format with template's `numberFormat`
- `resolveTemplateContent(template, overrides?)` — merge template JSON with hardcoded defaults

#### [NEW] `lib/document-verification.ts`

- `createVerificationRecord(data)` — generate unique code, store record
- `generateVerificationCode()` — collision-free short code (e.g., `AJ-2026-A7X9K2`)
- `verifyDocument(code)` — public lookup for verification page

#### [NEW] `app/staff/settings/_actions/pdf-template-actions.ts`

> ⚠️ **Access control**: All actions require `ADMIN` or `SUPER_ADMIN` role. Call `requireAdmin()` at the top of each action. Gate the settings tab UI at `app/staff/settings/_components/SettingsLayout.tsx` or equivalent.

Server actions:

- `saveTemplateAction(formData)` — upsert template content + branding
- `setDefaultTemplateAction(id)` — mark template as default (unset previous)
- `cloneTemplateAction(id, newName)` — clone a template
- `archiveTemplateAction(id)` — set status to ARCHIVED
- `activateTemplateAction(id)` — set status to ACTIVE
- `uploadSignatureAction(formData)` — upload to Supabase Storage, create record (no secondary approval; record `uploadedBy`)
- `deleteSignatureAction(id)` — remove signature (check not in active use)
- `assignSignatureAction(templateId, signatureId, position)` — assign to slot
- `removeSignatureAssignmentAction(templateId, position)` — unassign

#### [MODIFY] `lib/pdf-settings.ts`

- `getResolvedSignatures(templateId)` — read signature images as base64 data URIs
- Merge per-template branding overrides with global system settings

#### [NEW] `app/verify/[code]/page.tsx`

Public verification page (no auth required):

- Accepts a verification code from URL
- Shows: document type, recipient name, issue date, certificate number, verification status
- Clean branded page with academy logo
- Returns "Document not found" for invalid codes

---

### Frontend — Settings UI

#### [MODIFY] `app/staff/settings/_components/PDFSettingsForm.tsx`

Restructure into a tabbed panel with 3 sub-sections:

1. **Branding** (existing) — global logo, watermark, footer text, opacity
2. **Templates** — template list with status badges, click to edit
3. **Signatures** — signature upload and management grid

#### [NEW] `app/staff/settings/_components/TemplateEditor.tsx`

> ⚠️ **Access control**: Only render for `ADMIN` or `SUPER_ADMIN` users. Gate the Templates tab in the settings UI.

Form-based editor — **all text fields editable by ADMIN/SUPER_ADMIN**:

- **Header**: template name, type badge, status toggle (Draft/Active/Archived)
- **Content Fields** (editable text):
  - Certificate: title, subtitle, completionText, accreditationText, signatureLabels[]
  - Transcript: section headers (studentInfo, academicRecord), disclaimerText, signatureLabels[]
- **Numbering**: certificate number format with live preview (e.g., type `CERT-{YYYY}-{SEQ:4}` → see `CERT-2026-0001`)
- **Signature Slots**: dropdown pickers for each position, preview thumbnails
- **Branding Overrides**: optional per-template logo/watermark/footer (expandable section, defaults to global)
- **Actions**: Save, Clone, Archive, Set as Default
- Preview updates live in the `LivePDFViewer` alongside

#### [NEW] `app/staff/settings/_components/SignatureManager.tsx`

> ⚠️ **Access control**: Only render for `ADMIN` or `SUPER_ADMIN` users.

- Card grid of uploaded signatures showing:
  - Preview thumbnail (the signature image)
  - Label (role title), signer name
  - Expiry date (with warning badge if expired/expiring soon)
  - Which templates use this signature
- Upload dialog: drag-and-drop PNG/JPG, max 500KB, transparent background recommended
- Inline edit: label, signer name, expiry date
- Delete with confirmation (blocked if assigned to an active template)
- **No secondary approval required** — admin uploads with consent of the signer; `uploadedBy` recorded in audit log

#### [MODIFY] `app/staff/settings/_components/LivePDFViewer.tsx`

Enhanced preview:

- Accept `templateConfig`, `signatures`, and `branding` props
- **Student Picker**: optional dropdown to load a real student's data for realistic preview (fetched via API)
- Template selector dropdown (switches between all active templates)
- Show signature images above signature lines when assigned
- Show QR code placeholder in preview position
- Show certificate number with current format

---

### PDF Templates — Make Data-Driven

#### [MODIFY] `components/pdf/templates/CertificateTemplate.tsx`

- Accept optional `templateContent?: CertificateContent` prop
- Fall back to current hardcoded values if not provided (backward compat)
- Accept `signatures?: { label: string; signerName: string; imageDataUri: string }[]`
- Render signature image above the signature line when available, signer name below
- Accept optional `verificationCode?: string` for QR code rendering
- Accept optional `certificateNumber?: string` for formatted number display

#### [MODIFY] `components/pdf/templates/TranscriptTemplate.tsx`

- Same pattern — accept `templateContent`, `signatures`
- Editable: disclaimer text, section headers
- Verification QR code support

#### [MODIFY] `components/pdf/PDFBaseTemplate.tsx`

- Add optional `verificationCode` prop
- When provided, render a small QR code + verification URL text in the bottom-right area of the page (outside the main content, inside the footer zone)

---

### QR Code Integration

#### [NEW] `components/pdf/QRCodeBlock.tsx`

A react-pdf component that renders a QR code:

- Uses a server-side QR code generator (e.g., `qrcode` npm package) to generate a PNG data URI
- Renders as an `<Image>` in the PDF
- Includes text: "Scan to verify • verify.aerojet-academy.com/AJ-2026-A7X9K2"
- Placed in the footer/accreditation area

---

## Implementation Order

1. **Phase 1 — Schema & Migrations**: Add new Prisma models, run migration
2. **Phase 2 — Signatures**: Upload, manage, render in PDFs
3. **Phase 3 — Template Editor**: Content editing, cloning, lifecycle
4. **Phase 4 — Certificate Numbering**: Format configuration, auto-increment
5. **Phase 5 — QR Verification**: Code generation, public verification page, PDF embedding
6. **Phase 6 — Enhanced Preview**: Student picker, live content updates

## Verification Plan

### Automated Tests

- `bun run type-check` — all new types/models compile
- `bunx prisma validate` — schema validates
- `bunx prisma migrate dev` — migration applies cleanly

### Manual Verification

1. **Templates**: Create → Edit content → Clone → Archive → verify lifecycle
2. **Signatures**: Upload PNG → assign to template → verify in preview → verify in real PDF
3. **Numbering**: Set format → generate certificate → verify number increments
4. **QR Code**: Generate document → scan QR → verify public page shows correct data
5. **Preview**: Pick real student → verify data fills correctly in preview
6. **Backward compat**: Existing certificate/transcript generation still works with no template configured (hardcoded defaults)
