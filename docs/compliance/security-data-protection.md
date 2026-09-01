# ISO/IEC 27001 and Ghana Act 843 Compliance Register

Last reviewed: 2026-08-28

This register maps Aerojet Academy's product controls to ISO/IEC 27001:2022 and Ghana's Data Protection Act, 2012 (Act 843). It is implementation evidence, not a certificate or legal opinion. ISO/IEC 27001 certification still requires a defined ISMS scope, risk assessment, statement of applicability, internal audit, management review, corrective actions, and an accredited external audit if certification is required.

Primary references:

- ISO/IEC 27001:2022 official overview: https://www.iso.org/standard/27001
- Ghana Data Protection Act, 2012 (Act 843): https://nita.gov.gh/wp-content/uploads/2017/12/Data-Protection-Act-2012-Act-843.pdf

## Product Control Mapping

| Area | Current product evidence | ISO/IEC 27001 alignment | Ghana Act 843 alignment | Follow-up owner |
| --- | --- | --- | --- | --- |
| Public privacy notice | `/privacy-policy` explains categories, purposes, sharing, transfers, retention, security, incident notice, rights, cookies, and contacts. | Supports interested-party requirements, legal requirements, awareness, and privacy protection controls. | Covers purpose awareness, minimality, access/correction, retention, security safeguards, breach notification, and direct marketing objection. | Legal/compliance to approve wording and controller registration details. |
| Collection notice at registration | Registration form links to application terms and privacy notice before submission. | Supports awareness and acceptable processing before data capture. | Supports notice of collection purpose before personal data is submitted. | Admissions to ensure offline forms use equivalent wording. |
| Role-based portal access | `requireStaff`, `requirePermission`, and role-specific layouts gate staff/student/applicant/instructor/examiner areas. | Access control, identity management, least privilege. | Prevents unauthorised processing and disclosure. | Engineering to review privileged permissions quarterly. |
| Audit logging | `lib/audit/logger.ts`, staff audit log routes, and workflow-specific audit events record privileged actions. | Logging, monitoring, accountability, evidence preservation. | Supports accountability for processing and investigation of misuse. | Engineering to ensure all sensitive exports and admin changes are logged. |
| Data subject request queue | `/staff/gdpr` records access, erasure, rectification, restriction, portability, and objection requests with due dates and status. | Incident/request workflow evidence, continual improvement. | Supports access, correction, deletion/blocking, objection, and complaint-handling workflows. | Compliance to define Act 843 response SLA and escalation path. |
| Retention policies | `/staff/settings/retention`, `RetentionPolicy`, and retention cron support soft deletion or deletion for expired records. | Information lifecycle and data minimisation. | Supports retention only while authorised or necessary. | Legal/compliance to approve retention periods by record class. |
| Upload and document handling | UploadThing/Supabase storage paths, `FileUpload` model records (see `lib/storage/file-upload-record.ts`), and the nightly 30-day temporary-upload retention sweep for unlinked applicant/payment uploads (`lib/storage/uploadthing-mirror.ts`). | Asset management, supplier/cloud services, backup, and disposal controls. | Supports secure storage and limited retention for documents/payment proofs. | Engineering to document storage bucket permissions and encryption posture. |
| Security headers | `next.config.ts` sets CSP, HSTS, frame restrictions (X-Frame-Options: SAMEORIGIN), content-type protection, referrer policy, and permissions policy in production. CSP and HSTS are omitted in development. | Technical hardening and secure configuration. | Reduces risk of unauthorised access or disclosure. | Engineering to test CSP in staging after third-party changes. |
| Authentication controls | Password flows, passkeys, TOTP verification, rate-limited verification endpoints (resend-verification at 3/hr/IP, submit-payment-proof at 5/hr/IP), and session-gated portal layouts. The login endpoint itself is not rate-limited. | Identity, authentication, and secure access controls. | Reduces risk of unauthorised account access. | Engineering/security to require MFA for privileged roles. |
| Backups and recoverability | Active backup route at `/api/cron/backup` (gated by `CRON_SECRET`) exports selected tables via `lib/backup.ts` (`exportAllTables`/`sendBackupEmail`) to an admin-configured email on a configurable schedule and writes an `EXPORT` audit-log row. `lib/supabase/backup.ts` defines Supabase-targeted backup utilities (`performSupabaseBackup`, `listSupabaseBackups`, `downloadBackup`) but is **dormant** — not imported or invoked by any route or cron. | Availability, backup, and business continuity controls. | Supports restoration after compromise or data loss. | Operations to document restore tests and backup retention. |
| Incident handling | Public notice commits to investigation, integrity restoration, and notice to DPC/data subjects when required. | Incident response and communication controls. | Aligns with Act 843 security compromise notification duties. | Security lead to maintain an incident runbook and breach decision log. |
| Third-party processors | Privacy notice identifies payment, hosting, email, file-storage, regulators, aviation bodies, auditors, and advisers as recipient categories. | Supplier relationship and cloud service controls. | Supports processor authorisation and disclosure transparency. | Procurement/compliance to maintain processor register and DPAs. |

## Required Governance Evidence

- ISMS scope statement for Aerojet Academy systems, locations, services, and exclusions.
- Risk assessment methodology, risk register, treatment plan, and risk owner approvals.
- Statement of Applicability mapping selected ISO/IEC 27001 Annex A controls to implemented controls and exclusions.
- Data Protection Commission controller registration evidence or renewal evidence, if applicable.
- Processor register with contracts, transfer safeguards, security commitments, and review dates.
- Data inventory and record of processing activities by portal feature and business owner.
- Access review records for staff, finance, admissions, instructor, examiner, and admin roles.
- Backup restore-test records and incident tabletop records.
- Internal audit results, management review minutes, corrective actions, and continuous improvement log.

## Known Gaps To Close Before Claiming Compliance

- Confirm Aerojet's Data Protection Commission registration status and add registration/contact details to the public notice.
- Replace legacy internal labels that still say `gdpr` in URLs or database fields only if a migration window is available; current UI copy is neutral.
- Define and approve Ghana Act 843 response SLAs for access and correction requests. The current queue enforces an internal due date, but policy ownership must confirm it.
- Add a formal incident response runbook covering triage, containment, evidence preservation, DPC notification, data subject notice, and post-incident review.
- Require MFA for privileged roles and document exceptions.
- Complete supplier due diligence for hosting, file storage, email, analytics, and payment providers.
- No hard-delete disposal policy for stored file bytes: GDPR anonymisation (`lib/gdpr/anonymise.ts`) redacts `FileUpload` metadata but does not purge the underlying bytes from UploadThing/Supabase Storage; the temporary-upload sweep (`lib/storage/uploadthing-mirror.ts`) only covers `applicants/temp/` and `payments/temp/`.
- Supabase backup utilities (`lib/supabase/backup.ts`) are dormant — not imported or invoked by any route or cron.
- DSR queue provides dedicated workflow buttons only for ACCESS (Export) and ERASURE (Anonymise) in `GdprQueue.tsx`; RECTIFICATION, RESTRICTION, PORTABILITY, and OBJECTION requests are recorded and displayed but have no type-specific UI action.
