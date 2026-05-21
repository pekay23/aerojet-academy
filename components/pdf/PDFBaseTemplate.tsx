import { Document, Page, View, Text, StyleSheet, Image, Font } from '@react-pdf/renderer'
import React from 'react'

// You can register custom fonts here if needed
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2' });

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  watermarkContainer: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    opacity: 0.05,
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkImage: {
    width: '100%',
    height: 'auto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
  },
  headerLogo: {
    height: 40,
    width: 'auto',
  },
  headerTextContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  academyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
  },
  pageNumber: {
    fontSize: 9,
    color: '#64748b',
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
})

export interface PDFBaseTemplateProps {
  title: string
  academyName?: string
  logoUrl?: string
  watermarkUrl?: string
  footerText?: string
  children: React.ReactNode
}

export function PDFBaseTemplate({
  title,
  academyName = 'Aerojet Aviation Academy',
  logoUrl,
  watermarkUrl,
  footerText = 'Aerojet Aviation Academy | contact@aerojet.com',
  children,
}: PDFBaseTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark (Repeats on every page via 'fixed') */}
        {watermarkUrl && (
          <View fixed style={styles.watermarkContainer}>
            <Image src={watermarkUrl} style={styles.watermarkImage} />
          </View>
        )}

        {/* Header (Repeats on every page via 'fixed') */}
        <View fixed style={styles.header}>
          {logoUrl ? (
            <Image src={logoUrl} style={styles.headerLogo} />
          ) : (
            <Text style={styles.academyName}>{academyName}</Text>
          )}
          <View style={styles.headerTextContainer}>
            {logoUrl && <Text style={styles.academyName}>{academyName}</Text>}
            <Text style={styles.documentTitle}>{title}</Text>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.content}>{children}</View>

        {/* Footer (Repeats on every page via 'fixed') */}
        <View fixed style={styles.footer}>
          <Text style={styles.footerText}>{footerText}</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
