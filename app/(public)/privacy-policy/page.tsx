import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy & Data Protection Notice ',
  description:
    'How Aerojet Aviation Training Academy collects, uses, protects, retains, and discloses personal data under Ghana Data Protection Act, 2012 (Act 843).',
}

const dataCategories = [
  'Identity and contact details, including name, nationality, date of birth, email address, phone number, and address where required.',
  'Admissions and training records, including selected programme, application status, documents, payment proofs, interview notes, attendance, grades, examinations, certificates, and OJT/logbook records.',
  'Account, security, and usage data, including login events, audit logs, IP address, device/browser information, preferences, and support messages.',
  'Payment and finance records needed to process registration fees, tuition, wallets, invoices, refunds, and reconciliation.',
]

const purposes = [
  'process applications, verify eligibility, manage enrolment, deliver training, schedule examinations, and issue academic records',
  'verify payments, maintain financial records, prevent fraud, and comply with accounting, aviation training, and legal obligations',
  'operate secure portals for applicants, students, instructors, examiners, and staff',
  'send service messages, security notices, academic updates, and lawful marketing where you have not objected or opted out',
  'monitor platform reliability, investigate abuse, maintain audit logs, and improve academy services',
]

const rights = [
  'request confirmation of whether we hold your personal data and receive an understandable description of that data',
  'ask us to correct, complete, block, erase, or destroy personal data that is inaccurate, excessive, out of date, unlawfully obtained, or no longer authorised for retention',
  'object to direct marketing or other processing where the law gives you that right',
  'ask for information about recipients or categories of recipients who have received your data',
  "raise a complaint with Aerojet or with Ghana's Data Protection Commission",
]

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 pt-20">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:rounded-3xl sm:p-14">
          <div className="mb-10 border-b border-slate-100 pb-6">
            <span className="text-aerojet-sky mb-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase">
              Legal Policy
            </span>
            <h1 className="text-aerojet-blue text-3xl leading-tight font-black text-balance uppercase sm:text-4xl dark:text-white">
              Privacy & Data Protection Notice
            </h1>
            <p className="mt-3 text-sm text-slate-400 italic">Last updated: May 2026</p>
          </div>

          <div className="prose prose-slate prose-headings:text-aerojet-blue prose-headings:font-black prose-headings:uppercase prose-p:text-pretty prose-p:text-slate-600 prose-p:leading-relaxed prose-a:font-bold prose-a:text-aerojet-sky prose-a:no-underline hover:prose-a:underline max-w-none">
            <p className="text-lg">
              This notice explains how <strong>Aerojet Aviation Training Academy</strong> collects,
              uses, protects, stores, and discloses personal data when you use{' '}
              <Link href="/">www.aerojet-academy.com</Link>, apply for a programme, or access an
              Aerojet portal.
            </p>
            <p>
              Aerojet acts as a data controller for academy operations and follows the Ghana Data
              Protection Act, 2012 (Act 843). Our information security programme is managed against
              ISO/IEC 27001:2022 principles for confidentiality, integrity, availability, risk
              treatment, access control, logging, incident response, supplier management, and
              continual improvement.
            </p>

            <h3>Personal Data We Collect</h3>
            <ul>
              {dataCategories.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Why We Process Personal Data</h3>
            <p>
              We collect and process personal data only for specific academy purposes, including to:
            </p>
            <ul>
              {purposes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Legal Basis and Minimality</h3>
            <p>
              We process personal data where it is necessary for an application, contract, legal or
              regulatory obligation, legitimate academy operation, consent-based activity, or
              another lawful justification under Act 843. We limit collection to data that is
              relevant and necessary for the stated purpose.
            </p>

            <h3>Sharing and Processors</h3>
            <p>
              We may share personal data with authorised staff, instructors, examiners, payment
              providers, hosting providers, email and file-storage processors, regulators, aviation
              bodies, auditors, and professional advisers where needed for the purposes above. Third
              parties processing data for Aerojet must handle it securely and only under authorised
              instructions.
            </p>

            <h3>International Transfers</h3>
            <p>
              Some service providers may store or process data outside Ghana. Where this happens, we
              use reasonable contractual, technical, and organisational safeguards to protect the
              data and to keep processing consistent with Act 843.
            </p>

            <h3>Retention</h3>
            <p>
              We keep personal data only for as long as necessary for the stated purpose, academy
              operations, aviation training records, finance records, dispute handling, audit logs,
              and legal obligations. Staff can manage retention schedules in the portal, and expired
              records are deleted, anonymised, or restricted where retention is no longer
              authorised.
            </p>

            <h3>Security Measures</h3>
            <p>
              We use role-based access controls, authentication controls, audit logs, secure upload
              handling, retention workflows, security headers, least-privilege administration, and
              operational monitoring to reduce unauthorised access, alteration, disclosure, loss, or
              destruction of personal data.
            </p>

            <h3>Security Incidents</h3>
            <p>
              If we have reasonable grounds to believe personal data has been accessed or acquired
              by an unauthorised person, we will investigate, restore system integrity, and notify
              the Data Protection Commission and affected data subjects as soon as reasonably
              practicable where required by Act 843.
            </p>

            <h3>Your Rights</h3>
            <p>You may:</p>
            <ul>
              {rights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Cookies and Analytics</h3>
            <p>
              We use essential cookies for login, security, and portal functionality. We may also
              use privacy-respecting analytics to understand page performance and improve the
              website. You can control non-essential cookies through your browser settings where
              available.
            </p>

            <h3>Children and Applicants Under 16</h3>
            <p>
              Our public website is not directed at children under 16. If an applicant under 16 must
              provide personal data for a lawful academy process, we require involvement from a
              parent or guardian and limit processing to the relevant purpose.
            </p>

            <h3>Links to Other Websites</h3>
            <p>
              Our website may link to third-party websites. Their privacy practices are governed by
              their own notices, not this one.
            </p>

            <div className="not-prose mt-10 rounded-xl border border-slate-100 bg-slate-50 p-6">
              <h3 className="text-aerojet-blue mb-3 text-lg font-black uppercase">Contact Us</h3>
              <p className="mb-3 text-sm text-pretty text-slate-600">
                For privacy requests, correction requests, objections, breach questions, or
                complaints, contact Aerojet's data protection contact.
              </p>
              <p className="text-sm">
                Email:{' '}
                <a href="mailto:info@aerojet-academy.com" className="text-aerojet-sky font-bold">
                  info@aerojet-academy.com
                </a>
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
