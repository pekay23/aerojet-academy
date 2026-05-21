import React from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { PDFBaseTemplate } from '../PDFBaseTemplate'
import { formatCurrency } from '@/lib/currency'

const BRAND = {
  navy: '#002a5c',
  blue: '#1a56db',
  slate: '#64748b',
  border: '#e2e8f0',
  text: '#334155',
  lightBlue: '#f8fafc',
  danger: '#ef4444',
}

const styles = StyleSheet.create({
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.navy,
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 9,
    color: BRAND.slate,
  },
  confidentialBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: BRAND.danger,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  confidentialText: {
    color: BRAND.danger,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.navy,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    paddingBottom: 4,
  },

  // Table Styles
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.navy,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: BRAND.lightBlue,
  },
  tableCell: {
    fontSize: 9,
    color: BRAND.text,
  },

  // Column widths
  colFlex: { flex: 1 },
  colAmount: { width: 100, textAlign: 'right' },
  colCount: { width: 80, textAlign: 'right' },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: BRAND.lightBlue,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 12,
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 9,
    color: BRAND.slate,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.navy,
  },

  // Two columns layout for smaller tables
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  halfColumn: {
    flex: 1,
  },

  // Diagonal Watermark for Confidentiality
  confidentialWatermarkContainer: {
    position: 'absolute',
    top: 350,
    left: 100,
    transform: 'rotate(-45deg)',
    opacity: 0.05,
    zIndex: 10,
  },
  confidentialWatermarkText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: BRAND.danger,
    letterSpacing: 10,
  },
})

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export interface FinancialReportTemplateProps {
  year: number
  month: number
  summary: {
    totalRevenue: number
    revenueThisMonth: number
    pendingAmount: number
    avgTransactionValue: number
  }
  monthlyData: { month: string; revenue: number; count: number }[]
  revenueByType: { name: string; value: number; percentage: number }[]
  paymentStatus: { status: string; amount: number; count: number }[]
  logoUrl?: string
  watermarkUrl?: string
  watermarkOpacity?: number
}

export function FinancialReportTemplate({
  year,
  month,
  summary,
  monthlyData,
  revenueByType,
  paymentStatus,
  logoUrl,
  watermarkUrl,
  watermarkOpacity,
}: FinancialReportTemplateProps) {
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`

  return (
    <PDFBaseTemplate
      title="FINANCIAL REPORT"
      logoUrl={logoUrl}
      watermarkUrl={watermarkUrl}
      watermarkOpacity={watermarkOpacity}
      footerText="Aerojet Aviation Training Academy — CONFIDENTIAL FINANCIAL REPORT"
    >
      {/* Absolute Confidential Watermark Over Content */}
      <View fixed style={styles.confidentialWatermarkContainer}>
        <Text style={styles.confidentialWatermarkText}>CONFIDENTIAL</Text>
      </View>

      {/* Header */}
      <View style={styles.reportHeader}>
        <View>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
          <Text style={styles.reportMeta}>Financial Performance & Revenue Breakdown</Text>
        </View>
        <View style={styles.confidentialBadge}>
          <Text style={styles.confidentialText}>Confidential</Text>
        </View>
      </View>

      {/* Executive Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Revenue ({year})</Text>
            <Text style={styles.kpiValue}>{formatCurrency(summary.totalRevenue)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Revenue ({MONTH_NAMES[month - 1]})</Text>
            <Text style={styles.kpiValue}>{formatCurrency(summary.revenueThisMonth)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Pending Payments</Text>
            <Text style={styles.kpiValue}>{formatCurrency(summary.pendingAmount)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Avg Transaction</Text>
            <Text style={styles.kpiValue}>{formatCurrency(summary.avgTransactionValue)}</Text>
          </View>
        </View>
      </View>

      {/* Monthly Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Breakdown — {year}</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colFlex]}>Month</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Revenue</Text>
            <Text style={[styles.tableHeaderCell, styles.colCount]}>Transactions</Text>
          </View>
          {monthlyData.map((row, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colFlex]}>{row.month}</Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {formatCurrency(row.revenue)}
              </Text>
              <Text style={[styles.tableCell, styles.colCount]}>{row.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Two Column Layout for Breakdown */}
      <View style={styles.twoColumns}>
        {/* Revenue by Programme */}
        <View style={[styles.section, styles.halfColumn]}>
          <Text style={styles.sectionTitle}>By Programme</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colFlex]}>Programme</Text>
              <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>
                Amount
              </Text>
              <Text style={[styles.tableHeaderCell, { width: 40, textAlign: 'right' }]}>%</Text>
            </View>
            {revenueByType
              .filter((r) => r.value > 0)
              .map((row, index) => (
                <View
                  key={index}
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colFlex]}>{row.name}</Text>
                  <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>
                    {formatCurrency(row.value)}
                  </Text>
                  <Text style={[styles.tableCell, { width: 40, textAlign: 'right' }]}>
                    {row.percentage}%
                  </Text>
                </View>
              ))}
          </View>
        </View>

        {/* Payment Status */}
        <View style={[styles.section, styles.halfColumn]}>
          <Text style={styles.sectionTitle}>Payment Status</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colFlex]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>
                Amount
              </Text>
              <Text style={[styles.tableHeaderCell, { width: 40, textAlign: 'right' }]}>Count</Text>
            </View>
            {paymentStatus.map((row, index) => (
              <View
                key={index}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colFlex]}>{row.status}</Text>
                <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>
                  {formatCurrency(row.amount)}
                </Text>
                <Text style={[styles.tableCell, { width: 40, textAlign: 'right' }]}>
                  {row.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </PDFBaseTemplate>
  )
}
