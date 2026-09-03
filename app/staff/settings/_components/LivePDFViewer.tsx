'use client'

import React, { useState } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import { CertificateTemplate } from '@/components/pdf/templates/CertificateTemplate'
import { TranscriptTemplate, TranscriptRecord } from '@/components/pdf/templates/TranscriptTemplate'
import { InvoiceTemplate, InvoiceItem } from '@/components/pdf/templates/InvoiceTemplate'
import { FinancialReportTemplate } from '@/components/pdf/templates/FinancialReportTemplate'

interface LivePDFViewerProps {
  pdfSettings: {
    logoUrl: string
    watermarkUrl: string
    footerText: string
    watermarkOpacity: number
  }
}

const sampleRecords: TranscriptRecord[] = [
  { code: 'M1', courseName: 'Mathematics', credits: 4, grade: 'Pass', status: 'Pass' },
  { code: 'M2', courseName: 'Physics', credits: 4, grade: 'Pass', status: 'Pass' },
  {
    code: 'M3',
    courseName: 'Electrical Fundamentals',
    credits: 3,
    grade: 'Pass',
    status: 'Pass',
  },
  {
    code: 'M4',
    courseName: 'Electronic Fundamentals',
    credits: 3,
    grade: 'Pass',
    status: 'Pass',
  },
  {
    code: 'M5',
    courseName: 'Digital Techniques / Electronic Instrument Systems',
    credits: 4,
    grade: 'Pass',
    status: 'Pass',
  },
  {
    code: 'M6',
    courseName: 'Materials and Hardware',
    credits: 4,
    grade: 'Pass',
    status: 'Pass',
  },
  {
    code: 'M7',
    courseName: 'Maintenance Practices',
    credits: 6,
    grade: 'In Progress',
    status: 'In Progress',
  },
  { code: 'M8', courseName: 'Basic Aerodynamics', credits: 3, grade: 'Fail', status: 'Fail' },
  { code: 'M9', courseName: 'Human Factors', credits: 2, grade: 'Pass', status: 'Pass' },
  {
    code: 'M10',
    courseName: 'Aviation Legislation',
    credits: 3,
    grade: 'Pass',
    status: 'Pass',
  },
]

const sampleInvoiceItems: InvoiceItem[] = [
  {
    description: 'Tuition Fee - B1.1 Aircraft Maintenance',
    quantity: 1,
    unitPrice: 5500.0,
    total: 5500.0,
  },
  { description: 'Registration Fee', quantity: 1, unitPrice: 150.0, total: 150.0 },
  { description: 'Study Materials & PPE', quantity: 1, unitPrice: 350.0, total: 350.0 },
]

const sampleFinancialSummary = {
  totalRevenue: 1250000.0,
  revenueThisMonth: 150000.0,
  pendingAmount: 45000.0,
  avgTransactionValue: 4500.0,
}

const sampleMonthlyData = [
  { month: 'Jan', revenue: 95000, count: 21 },
  { month: 'Feb', revenue: 110000, count: 24 },
  { month: 'Mar', revenue: 105000, count: 23 },
  { month: 'Apr', revenue: 140000, count: 31 },
  { month: 'May', revenue: 150000, count: 33 },
]

const sampleRevenueByType = [
  { name: 'B1.1 Aircraft Maintenance', value: 850000, percentage: 68 },
  { name: 'B2 Avionics', value: 350000, percentage: 28 },
  { name: 'Short Courses', value: 50000, percentage: 4 },
]

const samplePaymentStatus = [
  { status: 'Completed', amount: 1205000, count: 260 },
  { status: 'Pending', amount: 45000, count: 12 },
]

export default function LivePDFViewer({ pdfSettings }: LivePDFViewerProps) {
  const [template, setTemplate] = useState<
    'certificate' | 'transcript' | 'invoice' | 'financial-report'
  >('certificate')

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setTemplate('certificate')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            template === 'certificate'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Certificate
        </button>
        <button
          onClick={() => setTemplate('transcript')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            template === 'transcript'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Transcript
        </button>
        <button
          onClick={() => setTemplate('invoice')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            template === 'invoice'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Invoice
        </button>
        <button
          onClick={() => setTemplate('financial-report')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            template === 'financial-report'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Financial Report
        </button>
      </div>

      <div className="h-[700px] w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100 shadow-inner">
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
          {template === 'certificate' ? (
            <CertificateTemplate
              {...pdfSettings}
              studentName="Jane Doe"
              programName="EASA Part-66 B1.1 Aircraft Maintenance"
              issueDate="15 Dec 2025"
              certificateNumber="CERT-2025-089"
            />
          ) : template === 'transcript' ? (
            <TranscriptTemplate
              {...pdfSettings}
              studentName="John Doe"
              studentId="AERO-2026-001"
              programName="EASA Part-66 B1.1 Aircraft Maintenance"
              enrollmentDate="01 Sep 2025"
              generatedDate={new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
              records={sampleRecords}
            />
          ) : template === 'invoice' ? (
            <InvoiceTemplate
              {...pdfSettings}
              invoiceNumber="INV-2026-0089"
              date={new Date()}
              // eslint-disable-next-line react-hooks/purity
              dueDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
              studentName="John Doe"
              studentEmail="john.doe@example.com"
              studentId="AERO-2026-001"
              items={sampleInvoiceItems}
              subtotal={6000.0}
              total={6000.0}
              currency="EUR"
            />
          ) : (
            <FinancialReportTemplate
              {...pdfSettings}
              year={2026}
              month={5}
              summary={sampleFinancialSummary}
              monthlyData={sampleMonthlyData}
              revenueByType={sampleRevenueByType}
              paymentStatus={samplePaymentStatus}
            />
          )}
        </PDFViewer>
      </div>
    </div>
  )
}
