import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { PDFBaseTemplate, PDFBaseTemplateProps } from '../PDFBaseTemplate'

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0f172a',
  },
  studentInfo: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    width: '100%',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
  },
  colCode: { width: '20%' },
  colCourse: { width: '40%' },
  colCredits: { width: '15%' },
  colGrade: { width: '15%' },
  colStatus: { width: '10%' },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  rowText: {
    fontSize: 10,
    color: '#334155',
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
}

export function TranscriptTemplate({
  studentName,
  studentId,
  enrollmentDate,
  programName,
  records,
  ...baseProps
}: TranscriptTemplateProps) {
  return (
    <PDFBaseTemplate title="Official Academic Transcript" {...baseProps}>
      <View style={styles.section}>
        <View style={styles.studentInfo}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{studentName}</Text>
            <Text style={[styles.infoLabel, { marginTop: 10 }]}>Program</Text>
            <Text style={styles.infoValue}>{programName}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Student ID</Text>
            <Text style={styles.infoValue}>{studentId}</Text>
            <Text style={[styles.infoLabel, { marginTop: 10 }]}>Date of Enrollment</Text>
            <Text style={styles.infoValue}>{enrollmentDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Academic Record</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colCode}>
              <Text style={styles.headerText}>Code</Text>
            </View>
            <View style={styles.colCourse}>
              <Text style={styles.headerText}>Course/Module Name</Text>
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

          {records.map((record, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.colCode}>
                <Text style={styles.rowText}>{record.code}</Text>
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
                <Text style={styles.rowText}>{record.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </PDFBaseTemplate>
  )
}
