import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { PDFBaseTemplate, PDFBaseTemplateProps } from '../PDFBaseTemplate'

const COLORS = {
  pass: '#059669',
  passBg: '#ecfdf5',
  fail: '#dc2626',
  failBg: '#fef2f2',
  inProgress: '#d97706',
  inProgressBg: '#fffbeb',
  headerBg: '#0f2b5b',
  headerText: '#ffffff',
  evenRow: '#f8fafc',
  oddRow: '#ffffff',
  text: '#1e293b',
  subtext: '#64748b',
  border: '#e2e8f0',
  label: '#64748b',
  value: '#0f172a',
  sectionBg: '#f1f5f9',
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.headerBg,
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Student identity card
  studentCard: {
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  studentCardLeft: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.sectionBg,
  },
  studentCardRight: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.oddRow,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 7,
    color: COLORS.label,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.value,
  },
  // Table styles
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.headerBg,
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    padding: 7,
    minHeight: 28,
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: COLORS.evenRow,
  },
  oddRow: {
    backgroundColor: COLORS.oddRow,
  },
  colCode: { width: '12%' },
  colCourse: { width: '36%' },
  colCredits: { width: '12%', alignItems: 'center' as const },
  colGrade: { width: '20%', alignItems: 'center' as const },
  colStatus: { width: '20%', alignItems: 'center' as const },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.headerText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rowText: {
    fontSize: 9,
    color: COLORS.text,
  },
  rowTextBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  // Status badges
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPass: {
    backgroundColor: COLORS.passBg,
    color: COLORS.pass,
  },
  statusFail: {
    backgroundColor: COLORS.failBg,
    color: COLORS.fail,
  },
  statusInProgress: {
    backgroundColor: COLORS.inProgressBg,
    color: COLORS.inProgress,
  },
  // Summary row
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.sectionBg,
    padding: 8,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.headerBg,
  },
  summaryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.headerBg,
  },
  // Disclaimer
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: COLORS.sectionBg,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.headerBg,
  },
  disclaimerText: {
    fontSize: 7,
    color: COLORS.subtext,
    lineHeight: 1.5,
  },
})

export interface TranscriptRecord {
  code: string
  courseName: string
  credits: number
  grade: string
  status: 'Pass' | 'Fail' | 'In Progress'
}

export interface TranscriptTemplateProps extends Omit<PDFBaseTemplateProps, 'children' | 'title'> {
  studentName: string
  studentId: string
  enrollmentDate: string
  programName: string
  records: TranscriptRecord[]
  generatedDate?: string
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Pass':
      return styles.statusPass
    case 'Fail':
      return styles.statusFail
    default:
      return styles.statusInProgress
  }
}

export function TranscriptTemplate({
  studentName,
  studentId,
  enrollmentDate,
  programName,
  records,
  generatedDate,
  ...baseProps
}: TranscriptTemplateProps) {
  const totalCredits = records.reduce((sum, r) => sum + r.credits, 0)
  const passedCount = records.filter((r) => r.status === 'Pass').length
  const passRate = records.length > 0 ? Math.round((passedCount / records.length) * 100) : 0

  return (
    <PDFBaseTemplate title="Official Academic Transcript" {...baseProps}>
      {/* Student Identity Section */}
      <View style={styles.section}>
        <View style={styles.studentCard}>
          <View style={styles.studentCardLeft}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student Name</Text>
              <Text style={styles.infoValue}>{studentName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Programme</Text>
              <Text style={styles.infoValue}>{programName}</Text>
            </View>
          </View>
          <View style={styles.studentCardRight}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={styles.infoValue}>{studentId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Enrolment</Text>
              <Text style={styles.infoValue}>{enrollmentDate}</Text>
            </View>
            {generatedDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date Generated</Text>
                <Text style={styles.infoValue}>{generatedDate}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Academic Record Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Academic Record</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colCode}>
              <Text style={styles.headerText}>Code</Text>
            </View>
            <View style={styles.colCourse}>
              <Text style={styles.headerText}>Course / Module</Text>
            </View>
            <View style={styles.colCredits}>
              <Text style={styles.headerText}>Credits</Text>
            </View>
            <View style={styles.colGrade}>
              <Text style={styles.headerText}>Grade</Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.headerText}>Status</Text>
            </View>
          </View>

          {/* Rows */}
          {records.map((record, index) => (
            <View
              style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
              key={index}
            >
              <View style={styles.colCode}>
                <Text style={styles.rowTextBold}>{record.code}</Text>
              </View>
              <View style={styles.colCourse}>
                <Text style={styles.rowText}>{record.courseName}</Text>
              </View>
              <View style={styles.colCredits}>
                <Text style={styles.rowText}>{record.credits}</Text>
              </View>
              <View style={styles.colGrade}>
                <Text style={styles.rowText}>{record.grade}</Text>
              </View>
              <View style={styles.colStatus}>
                <Text style={[styles.statusBadge, getStatusStyle(record.status)]}>
                  {record.status}
                </Text>
              </View>
            </View>
          ))}

          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View style={styles.colCode}>
              <Text style={styles.summaryText}>Total</Text>
            </View>
            <View style={styles.colCourse}>
              <Text style={styles.summaryText}>{records.length} modules</Text>
            </View>
            <View style={styles.colCredits}>
              <Text style={styles.summaryText}>{totalCredits}</Text>
            </View>
            <View style={styles.colGrade}>
              <Text style={styles.summaryText}>{passRate}% pass</Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.summaryText}>
                {passedCount}/{records.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This is an Academy-issued record. It is not an official EASA certificate. No grade-point
          average is computed — this is an EASA Part-147 training record. For EASA Part-66 licence
          applications, please refer to your official examination results issued by the competent
          authority.
        </Text>
      </View>
    </PDFBaseTemplate>
  )
}
