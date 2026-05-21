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
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Corner accent
  cornerDecoration: {
    position: 'absolute',
    width: 30,
    height: 30,
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
  // Content
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  divider: {
    width: 120,
    height: 2,
    backgroundColor: COLORS.gold,
    marginBottom: 25,
    marginTop: 5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.slate,
    marginBottom: 30,
    letterSpacing: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  nameUnderline: {
    width: '70%',
    height: 0.5,
    backgroundColor: COLORS.border,
    marginBottom: 25,
  },
  description: {
    fontSize: 11,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
    width: '80%',
    lineHeight: 1.6,
  },
  programName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  certNumber: {
    fontSize: 8,
    color: COLORS.slate,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 25,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.text,
    marginBottom: 40,
  },
  // Signature section
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
    marginTop: 30,
  },
  signatureBlock: {
    alignItems: 'center',
    width: 180,
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.slate,
    letterSpacing: 0.5,
  },
  signatureRole: {
    fontSize: 7,
    color: COLORS.slate,
    marginTop: 2,
  },
  // Accreditation note
  accreditation: {
    marginTop: 30,
    padding: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    width: '90%',
  },
  accreditationText: {
    fontSize: 7,
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
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  studentName,
  programName,
  issueDate,
  certificateNumber,
  ...baseProps
}) => {
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

          <Text style={styles.certNumber}>Certificate No. {certificateNumber}</Text>

          <Text style={styles.dateText}>Issued on {issueDate}</Text>

          {/* Signatures */}
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Training Manager</Text>
              <Text style={styles.signatureRole}>Aerojet Aviation Academy</Text>
            </View>

            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Academy Director</Text>
              <Text style={styles.signatureRole}>Aerojet Aviation Academy</Text>
            </View>
          </View>

          {/* Accreditation */}
          <View style={styles.accreditation}>
            <Text style={styles.accreditationText}>
              Aerojet Aviation Academy is an EASA Part-147 Approved Maintenance Training
              Organisation. This certificate attests to the completion of the approved training
              programme and does not constitute an EASA Part-66 Aircraft Maintenance Licence.
            </Text>
          </View>
        </View>
      </View>
    </PDFBaseTemplate>
  )
}
