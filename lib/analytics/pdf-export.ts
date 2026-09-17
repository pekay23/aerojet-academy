import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from '@/lib/currency';

export interface MonthlyDataRow {
  month: string
  revenue: number
  count: number
}

export interface RevenueByTypeRow {
  name: string
  value: number
  percentage: number
}

export interface PaymentStatusRow {
  status: string
  amount: number
  count: number
}

export interface FinancialReportData {
  summary: {
    totalRevenue: number
    revenueThisMonth: number
    pendingAmount: number
    avgTransactionValue: number
  }
  revenueByType: RevenueByTypeRow[]
  monthlyData: MonthlyDataRow[]
  paymentStatus: PaymentStatusRow[]
}

// Extending jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number
      head?: string[][]
      body?: string[][] | (([string, string, string] | [string, string]) | { [key: string]: unknown })[]
      theme?: 'striped' | 'grid'
      headStyles?: { fillColor?: number[] }
      margin?: { left?: number; right?: number }
    }) => jsPDF
    lastAutoTable?: { finalY: number }
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function generateFinancialPDF(data: FinancialReportData, year: number, month: number) {
  const { summary, revenueByType, monthlyData, paymentStatus } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const generatedAt = new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });

  // Add Logo Placeholder / Header
  doc.setFontSize(22);
  doc.setTextColor(15, 43, 91); // #0F2B5B
  doc.text('Financial Report', margin, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(`Aerojet Aviation Training Academy — ${periodLabel}`, margin, 32);
  
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedAt}`, pageWidth - margin - 50, 32);

  // Line separator
  doc.setDrawColor(15, 43, 91);
  doc.setLineWidth(1);
  doc.line(margin, 38, pageWidth - margin, 38);

  // KPI Summary
  doc.setFontSize(12);
  doc.setTextColor(15, 43, 91);
  doc.text('Executive Summary', margin, 50);

  const kpiData = [
    ['Total Revenue (Year)', formatCurrency(summary.totalRevenue)],
    ['Revenue (Month)', formatCurrency(summary.revenueThisMonth)],
    ['Pending Payments', formatCurrency(summary.pendingAmount)],
    ['Avg Transaction', formatCurrency(summary.avgTransactionValue)],
  ];

  doc.autoTable({
    startY: 55,
    head: [['Metric', 'Value']],
    body: kpiData,
    theme: 'striped',
    headStyles: { fillColor: [15, 43, 91] },
    margin: { left: margin, right: margin },
  });

  // Monthly Data
  const lastY = doc.lastAutoTable?.finalY ?? 55
  doc.setFontSize(12);
  doc.text(`Monthly Breakdown — ${year}`, margin, lastY + 15);

  const monthlyRows = monthlyData.map((m: MonthlyDataRow) => [
    m.month,
    formatCurrency(m.revenue),
    m.count.toString(),
  ]);

  doc.autoTable({
    startY: lastY + 20,
    head: [['Month', 'Revenue', 'Transactions']],
    body: monthlyRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 43, 91] },
    margin: { left: margin, right: margin },
  });

  // Program Type & Status
  const lastY2 = doc.lastAutoTable?.finalY ?? lastY + 20
  
  // Two columns roughly
  doc.text('Revenue by Programme', margin, lastY2 + 15);
  const progRows = revenueByType
    .filter((r: RevenueByTypeRow) => r.value > 0)
    .map((r: RevenueByTypeRow) => [r.name, formatCurrency(r.value), `${r.percentage}%`])

  doc.autoTable({
    startY: lastY2 + 20,
    head: [['Programme', 'Amount', 'Percentage']],
    body: progRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 43, 91] },
    margin: { left: margin, right: pageWidth / 2 + 5 },
  });

  doc.text('Payment Status', pageWidth / 2 + 10, lastY2 + 15)
  const statusRows = paymentStatus.map((s: PaymentStatusRow) => [s.status, formatCurrency(s.amount), s.count.toString()])

  doc.autoTable({
    startY: lastY2 + 20,
    head: [['Status', 'Amount', 'Count']],
    body: statusRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 43, 91] },
    margin: { left: pageWidth / 2 + 10, right: margin },
  })

  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'Aerojet Aviation Training Academy — Confidential',
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 15,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`AATA_Financial_Report_${periodLabel.replace(/\s+/g, '_')}.pdf`);
}
