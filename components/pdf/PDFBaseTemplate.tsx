import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'
import React from 'react'

// Brand colors (matching email template palette)
const BRAND = {
  navy: '#002a5c',
  blue: '#1a56db',
  sky: '#4c9ded',
  lightBlue: '#dbeafe',
  slate: '#64748b',
  lightSlate: '#f1f5f9',
  border: '#e2e8f0',
  white: '#ffffff',
  text: '#334155',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: 'Helvetica',
    backgroundColor: BRAND.white,
  },
  // Content wrapper with padding
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 15,
    paddingBottom: 80, // space for the fixed footer
  },
  // Watermark — centered in A4 page (595 x 842 pt)
  // Position: (595 - 280) / 2 = 157.5 left, (842 - 280) / 2 = 281 top
  watermarkContainer: {
    position: 'absolute',
    top: 281,
    left: 157.5,
    width: 280,
    height: 280,
  },
  watermarkImage: {
    width: 280,
    height: 280,
  },

  // ─── Header (white background, matching email style) ───
  headerContainer: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    backgroundColor: BRAND.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '65%',
  },
  headerLogo: {
    height: 32,
    width: 120,
    marginRight: 10,
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  academyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.navy,
    letterSpacing: 0.2,
  },
  academySubtitle: {
    fontSize: 6.5,
    color: BRAND.slate,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  documentTitle: {
    fontSize: 8,
    color: BRAND.slate,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
    maxWidth: 180,
    textAlign: 'right',
  },
  // Accent bar below header
  headerAccent: {
    height: 2.5,
    backgroundColor: BRAND.navy,
    marginTop: 10,
  },

  // ─── Footer (navy background, matching email footer style) ───
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND.navy,
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  footerLeft: {
    flexDirection: 'column',
    maxWidth: '55%',
  },
  footerAcademyName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: BRAND.white,
    marginBottom: 2,
  },
  footerAddress: {
    fontSize: 6.5,
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  footerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  footerContact: {
    fontSize: 6.5,
    color: '#cbd5e1',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  footerDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 5,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerGenerated: {
    fontSize: 6,
    color: '#64748b',
  },
  pageNumber: {
    fontSize: 6.5,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  copyright: {
    fontSize: 5.5,
    color: '#64748b',
    marginTop: 3,
  },

  // Content area
  content: {
    flex: 1,
  },
})

export interface PDFBaseTemplateProps {
  title: string
  academyName?: string
  academySubtitle?: string
  logoUrl?: string
  watermarkUrl?: string
  watermarkOpacity?: number
  footerText?: string
  orientation?: 'portrait' | 'landscape'
  children: React.ReactNode
}

export function PDFBaseTemplate({
  title,
  academyName = 'Aerojet Aviation Training Academy',
  academySubtitle = 'EASA Part-147 Approved Training Organisation',
  logoUrl,
  watermarkUrl,
  watermarkOpacity = 0.15,
  footerText,
  orientation = 'portrait',
  children,
}: PDFBaseTemplateProps) {
  const generatedDate = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const year = new Date().getFullYear()

  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        {/* Header */}
        <View fixed style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {logoUrl && <Image src={logoUrl} style={styles.headerLogo} />}
              {!logoUrl && (
                <View style={styles.headerTextContainer}>
                  <Text style={styles.academyName}>{academyName}</Text>
                  <Text style={styles.academySubtitle}>{academySubtitle}</Text>
                </View>
              )}
            </View>
            <Text style={styles.documentTitle}>{title}</Text>
          </View>
          <View style={styles.headerAccent} />
        </View>

        {/* Main Content */}
        <View style={styles.contentWrapper}>
          <View style={styles.content}>{children}</View>
        </View>

        {/* Watermark — rendered AFTER content so it's visible above opaque backgrounds */}
        <View
          fixed
          style={{
            position: 'absolute',
            top: 250,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: watermarkOpacity,
          }}
        >
          {watermarkUrl && <Image src={watermarkUrl} style={{ width: 280, height: 280 }} />}
          <Text
            style={{
              position: 'absolute',
              color: BRAND.slate,
              fontSize: 60,
              fontWeight: 'bold',
              transform: 'rotate(-45deg)',
              opacity: 0.3,
              letterSpacing: 4,
            }}
          >
            CONFIDENTIAL
          </Text>
        </View>

        {/* Footer (navy background, mirrors email footer styling) */}
        <View fixed style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerAcademyName}>Aerojet Aviation Training Academy</Text>
              <Text style={styles.footerAddress}>
                {footerText || 'Small Engines Dept., ATTC\nKokomlemle, Accra — Ghana'}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerContact}>
                trainingprograms@aerojet-academy.com{'\n'}+233 209 848 423
              </Text>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerBottom}>
            <Text style={styles.footerGenerated}>
              Generated on {generatedDate} — This document is digitally generated.
            </Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
            />
          </View>
          <Text style={styles.copyright}>
            © {year} Aerojet Aviation Training Academy. All rights reserved.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
