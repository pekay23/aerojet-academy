import React from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { PDFBaseTemplate, PDFBaseTemplateProps } from '../PDFBaseTemplate'

const COLORS = {
  navy: '#0f2b5b',
  blue: '#1a56db',
  gold: '#b8860b',
  goldLight: '#fdf6e3',
  slate: '#64748b',
  text: '#1e293b',
  border: '#e2e8f0',
  white: '#ffffff',
}

const styles = StyleSheet.create({
  // Decorative border
  outerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.navy,
    padding: 4,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: COLORS.gold,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Corner accent
  cornerDecoration: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: COLORS.gold,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  // Content — reduced font sizes to prevent text truncation
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  divider: {
    width: 100,
    height: 2,
    backgroundColor: COLORS.gold,
    marginBottom: 20,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.slate,
    marginBottom: 20,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  nameUnderline: {
    width: '60%',
    height: 0.5,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },
  description: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
    width: '85%',
    lineHeight: 1.5,
  },
  programName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 22,
    textAlign: 'center',
    letterSpacing: 0.3,
    width: '90%',
  },
  certNumber: {
    fontSize: 7.5,
    color: COLORS.slate,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 18,
    textAlign: 'center',
  },
  examDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  examDetailBlock: {
    alignItems: 'center',
    minWidth: 90,
  },
  examDetailLabel: {
    fontSize: 6.5,
    color: COLORS.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  examDetailValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.navy,
    textAlign: 'center',
  },
  passBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  passBadgeText: {
    fontSize: 8,
    color: COLORS.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  // Signature section
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
  },
  signatureBlock: {
    alignItems: 'center',
    width: 160,
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8.5,
    color: COLORS.slate,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 6.5,
    color: COLORS.slate,
    marginTop: 2,
    textAlign: 'center',
  },
  // Accreditation note
  accreditation: {
    marginTop: 22,
    padding: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    width: '90%',
  },
  accreditationText: {
    fontSize: 6.5,
    color: COLORS.slate,
    textAlign: 'center',
    lineHeight: 1.4,
  },
})

export interface CertificateTemplateProps extends Omit<PDFBaseTemplateProps, 'children' | 'title'> {
  studentName: string
  programName: string
  issueDate: string
  certificateNumber: string
  moduleCode?: string
  score?: number
  totalPoints?: number
  percentage?: number
  passMarkPct?: number
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  studentName,
  programName,
  issueDate,
  certificateNumber,
  moduleCode,
  score,
  totalPoints,
  percentage,
  passMarkPct,
  ...baseProps
}) => {
  const passed = percentage != null && passMarkPct != null && percentage >= passMarkPct
  return (
    <PDFBaseTemplate title={`Certificate — ${certificateNumber}`} {...baseProps}>
      {/* Decorative double border */}
      <View style={styles.outerBorder}>
        {/* Corner decorations */}
        <View style={[styles.cornerDecoration, styles.topLeft]} />
        <View style={[styles.cornerDecoration, styles.topRight]} />
        <View style={[styles.cornerDecoration, styles.bottomLeft]} />
        <View style={[styles.cornerDecoration, styles.bottomRight]} />

        <View style={styles.innerBorder}>
          <Text style={styles.title}>Certificate of Completion</Text>
          <View style={styles.divider} />

          <Text style={styles.subtitle}>This is to certify that</Text>

          <Text style={styles.name}>{studentName}</Text>
          <View style={styles.nameUnderline} />

          <Text style={styles.description}>
            has successfully completed the prescribed training and assessment requirements for
          </Text>

          <Text style={styles.programName}>{programName}</Text>

          {moduleCode && (
            <Text style={styles.subtitle}>Module: {moduleCode}</Text>
          )}

          {percentage != null && (
            <View style={styles.examDetailsContainer}>
              <View style={styles.examDetailBlock}>
                <Text style={styles.examDetailLabel}>Percentage</Text>
                <Text style={styles.examDetailValue}>{percentage.toFixed(1)}%</Text>
              </View>
              {score != null && totalPoints != null && totalPoints > 0 && (
                <View style={styles.examDetailBlock}>
                  <Text style={styles.examDetailLabel}>Score</Text>
                  <Text style={styles.examDetailValue}>{score}/{totalPoints}</Text>
                </View>
              )}
              {passMarkPct != null && (
                <View style={styles.examDetailBlock}>
                  <Text style={styles.examDetailLabel}>Pass Mark</Text>
                  <Text style={styles.examDetailValue}>{passMarkPct}%</Text>
                </View>
              )}
            </View>
          )}

          {passed && (
            <View style={styles.passBadge}>
              <Text style={styles.passBadgeText}>PASSED</Text>
            </View>
          )}

          <Text style={styles.certNumber}>Certificate No. {certificateNumber}</Text>

          <Text style={styles.dateText}>Issued on {issueDate}</Text>

          {/* Signatures */}
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Training Manager</Text>
              <Text style={styles.signatureRole}>Aerojet Aviation Training Academy</Text>
            </View>

            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Academy Director</Text>
              <Text style={styles.signatureRole}>Aerojet Aviation Training Academy</Text>
            </View>
          </View>

          {/* Accreditation */}
          <View style={styles.accreditation}>
            <Text style={styles.accreditationText}>
              Aerojet Aviation Training Academy is an EASA Part-147 Approved Maintenance Training
              Organisation. This certificate attests to the completion of the approved training
              programme and does not constitute an EASA Part-66 Aircraft Maintenance Licence.
            </Text>
          </View>
        </View>
      </View>
    </PDFBaseTemplate>
  )
}
