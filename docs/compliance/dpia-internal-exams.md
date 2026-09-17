# Data Protection Impact Assessment (DPIA) — Internal Exam System

**Last updated:** 2026-09-02
**Scope:** Internal exam system for EASA Part-147 aviation training
**Regulatory basis:** GDPR Article 35, EASA Part-147, Ghana Data Protection Act 2012 (Act 843)

---

## 1. Purpose of Processing

The internal exam system processes personal data to:

- Assess student knowledge against EASA Part-147 syllabus requirements
- Issue certificates of recognition for passed examinations
- Maintain exam integrity through identity verification and proctoring
- Generate audit trails for regulatory compliance (7-year retention)

Processing is necessary for the performance of a contract (enrollment agreement) and for compliance with legal obligations (EASA Part-147 regulatory requirements).

---

## 2. Data Categories Processed

### 2.1 Candidate Identification Data
- Full legal name
- Date of birth
- Nationality
- Email address
- Phone number
- Student ID

### 2.2 Identity Verification Data
- Candidate photo (passport-style)
- ID document type (passport, national ID, driving licence)
- ID document number
- Biometric consent records

### 2.3 Exam Performance Data
- Exam responses and selected answers
- Scores (percentage, points, pass/fail)
- Attempt numbers and timestamps
- Time extensions and recovery records

### 2.4 Proctoring and Integrity Data
- IP address and user agent
- Tab switch count
- Fullscreen exit count
- Keyboard event count
- SEB (Safe Exam Browser) verification data
- Browser exam key (BEK) hashes

### 2.5 Consent Records
- Declaration of truthfulness
- Consent to monitoring
- Consent to identity capture
- Consent to result processing

---

## 3. Retention Periods

| Data Category | Retention Period | Basis |
|---------------|-----------------|-------|
| Exam integrity records (scores, answers, violations) | 7 years | EASA Part-147 |
| Audit logs with hash chain | 7 years | EASA + GDPR integrity exception |
| PII (name, photo, ID documents) | 7 years (redactable on GDPR erasure request) | EASA + GDPR Article 17 |
| Access codes | 90 days post-session | Operational |
| Consent records | 7 years | Regulatory evidence |
| Proctoring logs | 7 years | Exam integrity |

---

## 4. Security Measures

### 4.1 Technical Measures
- **Encryption at rest:** All data encrypted in PostgreSQL (Neon) with AES-256
- **Encryption in transit:** TLS 1.3 for all connections
- **Access control:** Role-based access control (RBAC) with `requirePermission()` guards
- **Audit logging:** Immutable audit log with hash chain integrity verification
- **Rate limiting:** Exam-start endpoint rate-limited to 5 requests/minute per user
- **Session security:** NextAuth.js JWT sessions with TOTP 2FA support

### 4.2 Organizational Measures
- Staff training on data handling and exam integrity
- Segregation of duties (instructors, admins, supervisors)
- Regular access reviews and permission audits
- Incident response procedures for data breaches

### 4.3 Exam-Specific Measures
- Server-side grading (correct answers never sent to client)
- Randomized question order and options per candidate
- SEB lockdown for high-stakes exams
- Alternative proctoring pathway for accessibility
- Access code authentication with candidate binding

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Risk Level |
|------|-----------|--------|------------|
| Unauthorized access to exam answers | Low | High | Medium |
| PII breach via compromised account | Low | High | Medium |
| Exam integrity compromise (cheating) | Medium | Medium | Medium |
| Data retention exceedance | Low | Medium | Low |
| Incomplete erasure on GDPR request | Low | Medium | Low |
| Proctoring data misuse | Low | Medium | Low |
| Access code interception | Low | High | Medium |

---

## 6. Mitigation Measures

### 6.1 Unauthorized Access to Exam Answers
- **Mitigation:** Server-side paper binding; correct answers never transmitted to client
- **Residual risk:** Low — architecture prevents exposure by design

### 6.2 PII Breach
- **Mitigation:** RBAC, 2FA, encryption, audit logging, rate limiting
- **Residual risk:** Low — multiple layers of defense

### 6.3 Exam Integrity Compromise
- **Mitigation:** SEB lockdown, randomized papers, proctoring detection, audit trails
- **Residual risk:** Low — diversified detection methods

### 6.4 Data Retention Exceedance
- **Mitigation:** Automated GDPR retention cron (`/api/cron/gdpr-retention`)
- **Residual risk:** Low — automated sweeps enforce policy

### 6.5 Incomplete GDPR Erasure
- **Mitigation:** Anonymisation via `lib/gdpr/anonymise.ts`; financial/regulatory rows preserved for compliance
- **Residual risk:** Low — documented in retention policy

### 6.6 Access Code Interception
- **Mitigation:** Single-use codes, expiry windows, candidate binding, authentication required for validation
- **Residual risk:** Low — codes are time-limited and candidate-bound

---

## 7. Data Flows

```
Candidate → Access Code Validation → Registration Record Created
    ↓
Pre-Exam Form (Identity Verification) → Registration Updated
    ↓
Exam Session (Answers Stored Server-Side) → Grading (Server-Side)
    ↓
Results Published → Certificate Generated (Future)
    ↓
Audit Log (Hash Chain) → Retention Sweep (7 Years)
```

---

## 8. Consultation

- **Data Protection Officer:** [To be designated]
- **Legal Review:** [Pending legal sign-off]
- **Technical Review:** Engineering team confirmed security measures implemented

---

## 9. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Owner | _____________ | ________ | _____________ |
| Data Protection Officer | _____________ | ________ | _____________ |
| Technical Lead | _____________ | ________ | _____________ |
| Compliance Officer | _____________ | ________ | _____________ |

---

## 10. Related Documentation

- `docs/guides/easa-exam-compliance.md` — EASA Part-147 compliance requirements
- `docs/compliance/security-data-protection.md` — ISO 27001 and Act 843 control mapping
- `lib/gdpr/` — GDPR module (export, anonymise, retention)
- `lib/audit/logger.ts` — Audit logging infrastructure

---

*End of DPIA — Internal Exam System*
