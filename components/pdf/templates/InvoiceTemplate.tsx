import React from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { PDFBaseTemplate } from '../PDFBaseTemplate'
import { format } from 'date-fns'

const BRAND = {
  navy: '#002a5c',
  slate: '#64748b',
  border: '#e2e8f0',
  text: '#334155',
  lightBlue: '#f8fafc',
}

const styles = StyleSheet.create({
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    flexDirection: 'column',
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: BRAND.slate,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 10,
    color: BRAND.text,
    lineHeight: 1.4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  invoiceDetails: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: BRAND.slate,
    marginRight: 10,
  },
  detailValue: {
    fontSize: 10,
    color: BRAND.text,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },

  // Table
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.navy,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: BRAND.lightBlue,
  },
  tableCell: {
    fontSize: 9,
    color: BRAND.text,
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: 'center' },
  colUnit: { width: 80, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },

  // Totals
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  totalLabel: {
    fontSize: 10,
    color: BRAND.slate,
  },
  totalValue: {
    fontSize: 10,
    color: BRAND.text,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.navy,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.navy,
  },

  // Payment Notes
  notesSection: {
    marginTop: 'auto', // pushes to bottom of content
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BRAND.navy,
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 9,
    color: BRAND.slate,
    lineHeight: 1.5,
  },
})

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoiceTemplateProps {
  invoiceNumber: string
  date: Date
  dueDate: Date
  studentName: string
  studentEmail: string
  studentId?: string
  items: InvoiceItem[]
  subtotal: number
  total: number
  currency?: string
  logoUrl?: string
  watermarkUrl?: string
  watermarkOpacity?: number
}

export function InvoiceTemplate({
  invoiceNumber,
  date,
  dueDate,
  studentName,
  studentEmail,
  studentId,
  items,
  subtotal,
  total,
  currency = 'EUR',
  logoUrl,
  watermarkUrl,
  watermarkOpacity,
}: InvoiceTemplateProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <PDFBaseTemplate
      title="INVOICE"
      logoUrl={logoUrl}
      watermarkUrl={watermarkUrl}
      watermarkOpacity={watermarkOpacity}
      footerText="Payment is due within 7 days. Please use the invoice number as reference."
    >
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.billTo}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={[styles.infoText, styles.boldText]}>{studentName}</Text>
          <Text style={styles.infoText}>{studentEmail}</Text>
          {studentId && <Text style={styles.infoText}>Student ID: {studentId}</Text>}
        </View>

        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice No:</Text>
            <Text style={styles.detailValue}>{invoiceNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{format(date, 'dd MMM yyyy')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>{format(dueDate, 'dd MMM yyyy')}</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit Price</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.colUnit]}>{formatMoney(item.unitPrice)}</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>{formatMoney(item.total)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(total)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Notes - Pushed to bottom */}
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Payment Information</Text>
        <Text style={styles.notesContent}>
          Please transfer the total amount to the following bank account within 7 days.
          {'\n'}Use the Invoice Number as the payment reference.
          {'\n\n'}Bank: FNB Bank
          {'\n'}Account Name: AEROJET FOUNDATION
          {'\n'}Account Number: 1020003980687
          {'\n'}Branch Code: 330102
          {'\n'}SWIFT: FIRNGHACXXX
        </Text>
      </View>
    </PDFBaseTemplate>
  )
}
