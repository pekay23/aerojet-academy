import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { LogbookPreview, type LogbookPreviewData } from '@/components/shared/LogbookPreview'
import { requireStaff } from '@/lib/auth/helpers'

export const metadata: Metadata = { title: 'Generic OJT Logbook Preview | Staff' }

const genericLogbook: LogbookPreviewData = {
  studentName: 'Sample Student',
  studentId: 'AATA-0000',
  email: 'student@example.com',
  licenceCategory: 'B1.1',
  facilityName: 'Aerojet Academy',
  facilityApprovalNo: 'AATA/OJT/SAMPLE',
  startDate: new Date('2026-01-01').toISOString(),
  targetEndDate: new Date('2026-12-31').toISOString(),
  totalLoggedHours: 12,
  status: 'SAMPLE',
  entries: [
    {
      id: 'sample-entry-1',
      date: new Date('2026-01-15').toISOString(),
      aircraftType: 'B737-800',
      aircraftRegistration: '9G-AJT',
      ataChapter: { code: '32', title: 'Landing Gear', category: 'Airframe' },
      taskDescription:
        'Observed and assisted with inspection of main landing gear doors, uplock mechanism, and associated hydraulic lines under supervisor instruction.',
      workOrderReference: 'WO-SAMPLE-001',
      maintenanceManualRef: 'AMM 32-10-00',
      maintenanceType: 'INSPECTION',
      durationHours: 4,
      supervisorSignature: true,
      studentSignature: true,
      verifiedByManagement: false,
      licenceCategory: 'B1.1',
      workEnvironment: 'HANGAR',
      toolsUsed: 'Inspection mirror, torch, torque wrench',
      partNumbersUsed: 'N/A',
      safetyPrecautions: 'Aircraft isolated, landing gear pins installed, area barriered.',
      competencyRating: 4,
    },
    {
      id: 'sample-entry-2',
      date: new Date('2026-01-22').toISOString(),
      aircraftType: 'A320',
      aircraftRegistration: '9G-AJA',
      ataChapter: { code: '24', title: 'Electrical Power', category: 'Systems' },
      taskDescription:
        'Assisted with functional checks of external power connection and monitored cockpit indications during ground power transfer.',
      workOrderReference: 'WO-SAMPLE-002',
      maintenanceManualRef: 'AMM 24-41-00',
      maintenanceType: 'SERVICING',
      durationHours: 3.5,
      supervisorSignature: true,
      studentSignature: false,
      verifiedByManagement: false,
      licenceCategory: 'B1.1',
      workEnvironment: 'APRON',
      toolsUsed: 'Ground power unit, multimeter, headset',
      partNumbersUsed: 'N/A',
      safetyPrecautions: 'Communication maintained with cockpit, GPU cables inspected before use.',
      competencyRating: 3,
    },
    {
      id: 'sample-entry-3',
      date: new Date('2026-02-03').toISOString(),
      aircraftType: 'B737-800',
      aircraftRegistration: '9G-AJT',
      ataChapter: { code: '05', title: 'Time Limits / Maintenance Checks', category: 'General' },
      taskDescription:
        'Reviewed maintenance check package and cross-checked completed task cards against logbook and work order requirements.',
      workOrderReference: 'WO-SAMPLE-003',
      maintenanceManualRef: 'MPD 05-10-00',
      maintenanceType: 'LINE',
      durationHours: 4.5,
      supervisorSignature: false,
      studentSignature: false,
      verifiedByManagement: false,
      licenceCategory: 'B1.1',
      workEnvironment: 'HANGAR',
      toolsUsed: 'Maintenance planning system, task cards',
      partNumbersUsed: 'N/A',
      safetyPrecautions: 'Document control procedures followed.',
      competencyRating: null,
    },
  ],
  analytics: {
    totalHours: 12,
    hoursByType: { INSPECTION: 4, SERVICING: 3.5, LINE: 4.5 },
    ataChaptersCovered: 3,
    signedEntries: 1,
    unsignedEntries: 2,
    monthsExperience: 1,
    totalATAChapters: 100,
  },
}

export default async function GenericOJTPreviewPage() {
  await requireStaff()

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link
          href="/staff/ojt"
          className="hover:text-aerojet-blue flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
          aria-label="Back to OJT logbooks"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight text-balance sm:text-3xl dark:text-white">
            Generic OJT Logbook Preview
          </h1>
          <p className="mt-1 text-sm font-medium text-pretty text-slate-500 dark:text-slate-400">
            Sample printable layout for reviewing the Aerojet OJT logbook format before student
            logbooks are generated.
          </p>
        </div>
      </div>

      <LogbookPreview mode="staff" logbook={genericLogbook} />
    </div>
  )
}
