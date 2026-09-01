import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogbookPreview } from '@/components/shared/LogbookPreview'

describe('LogbookPreview', () => {
  const mockLogbook = {
    studentName: 'John Doe',
    studentId: 'STU001',
    email: 'john@example.com',
    licenceCategory: 'B1.1',
    facilityName: 'Aerojet Hangar 1',
    facilityApprovalNo: 'EASA.147.001',
    startDate: '2024-01-15',
    targetEndDate: '2025-01-15',
    totalLoggedHours: 240,
    status: 'Active',
    entries: [
      {
        id: '1',
        date: '2024-02-01',
        aircraftType: 'B737',
        aircraftRegistration: '9G-ABC',
        ataChapter: { code: '21', title: 'Air Conditioning' },
        taskDescription: 'Inspected ACM',
        workOrderReference: 'WO-001',
        maintenanceManualRef: 'AMM-21-00',
        maintenanceType: 'INSPECTION',
        durationHours: 2,
        supervisorSignature: true,
        studentSignature: true,
        verifiedByManagement: false,
        licenceCategory: 'B1.1',
        workEnvironment: 'Hangar',
        toolsUsed: 'Torque wrench set',
        partNumbersUsed: null,
        safetyPrecautions: 'Wear safety glasses',
        toolsUsed: 'Torque wrench set',
        partNumbersUsed: null,
        safetyPrecautions: 'Wear safety glasses',
        toolsUsed: 'Torque wrench set',
        partNumbersUsed: null,
        safetyPrecautions: 'Wear safety glasses',
        competencyRating: 4,
      },
    ],
    analytics: {
      totalHours: 240,
      hoursByType: { INSPECTION: 100 },
      ataChaptersCovered: 15,
      signedEntries: 40,
      unsignedEntries: 5,
    },
  }

  it('renders without crashing', () => {
    render(<LogbookPreview logbook={mockLogbook} mode="staff" />)
    expect(screen.getByText('Logbook preview')).toBeInTheDocument()
  })

  it('renders in staff mode', () => {
    render(<LogbookPreview logbook={mockLogbook} mode="staff" />)
    expect(screen.getByText('Printable preview of the official Aerojet OJT logbook layout.')).toBeInTheDocument()
  })

  it('renders in student mode', () => {
    render(<LogbookPreview logbook={mockLogbook} mode="student" />)
    expect(screen.getByText('Protected portal preview of your official Aerojet OJT logbook.')).toBeInTheDocument()
  })

  it('shows page navigation', () => {
    render(<LogbookPreview logbook={mockLogbook} mode="staff" />)
    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
  })

  it('renders student name on cover page', () => {
    render(<LogbookPreview logbook={mockLogbook} mode="staff" />)
    const elements = screen.getAllByText('John Doe')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })
})
