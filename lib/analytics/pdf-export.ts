import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from '@/lib/currency';

// Extending jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function generateFinancialPDF(data: any, year: number, month: number) {
  const { summary, revenueByType, paymentMethods, monthlyData, paymentStatus } = data;
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
  const lastY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.text(`Monthly Breakdown — ${year}`, margin, lastY + 15);

  const monthlyRows = monthlyData.map((m: any) => [
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
  const lastY2 = (doc as any).lastAutoTable.finalY;
  
  // Two columns roughly
  doc.text('Revenue by Programme', margin, lastY2 + 15);
  const progRows = revenueByType
    .filter((r: any) => r.value > 0)
    .map((r: any) => [r.name, formatCurrency(r.value), `${r.percentage}%`]);

  doc.autoTable({
    startY: lastY2 + 20,
    head: [['Programme', 'Amount', 'Percentage']],
    body: progRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 43, 91] },
    margin: { left: margin, right: pageWidth / 2 + 5 },
  });

  const lastY3 = (doc as any).lastAutoTable.finalY;
  doc.text('Payment Status', pageWidth / 2 + 10, lastY2 + 15);
  const statusRows = paymentStatus.map((s: any) => [s.status, formatCurrency(s.amount), s.count.toString()]);

  doc.autoTable({
    startY: lastY2 + 20,
    head: [['Status', 'Amount', 'Count']],
    body: statusRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 43, 91] },
    margin: { left: pageWidth / 2 + 10, right: margin },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
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
