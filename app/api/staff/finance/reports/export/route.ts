import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import {
  getFinanceReportSummary,
  getRevenueByProgrammeType,
  getPaymentMethodBreakdown,
  getMonthlyRevenueData,
  getPaymentStatusBreakdown,
} from '@/lib/analytics/reports'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatEUR(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount)
}

/**
 * GET /api/staff/finance/reports/export
 *
 * Generates a print-friendly HTML financial report.
 * Query params: ?year=2024&month=6&format=html|pdf
 */
export async function GET(req: NextRequest) {
  try {
    await requireStaff()

    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    const [summary, revenueByType, paymentMethods, monthlyData, paymentStatus] = await Promise.all([
      getFinanceReportSummary({ year, month }),
      getRevenueByProgrammeType({ year, month }),
      getPaymentMethodBreakdown(),
      getMonthlyRevenueData({ year }),
      getPaymentStatusBreakdown({ year, month }),
    ])

    const periodLabel = year
      ? month
        ? `${MONTH_NAMES[month - 1]} ${year}`
        : `Year ${year}`
      : `Year ${new Date().getFullYear()}`

    const generatedAt = new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })

    const maxMonthlyRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1)

    // Construct absolute logo URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    const logoUrl = `${baseUrl}/images/logos/AATA_logo_hor_onWhite.png`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Financial Report — ${periodLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 32px;
    }

    /* Header */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0F2B5B;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .report-header h1 {
      font-size: 28px;
      font-weight: 800;
      color: #0F2B5B;
      letter-spacing: -0.02em;
    }
    .report-header .subtitle {
      font-size: 15px;
      color: #64748b;
      margin-top: 4px;
    }
    .report-header .meta {
      text-align: right;
      font-size: 12px;
      color: #94a3b8;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }
    .kpi-card {
      padding: 18px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .kpi-card .label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .kpi-card .value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-card .detail {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .kpi-card.accent { border-left: 4px solid #0F2B5B; }
    .kpi-card.success .value { color: #059669; }
    .kpi-card.warning .value { color: #d97706; }

    /* Section Headers */
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0F2B5B;
      margin: 32px 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    /* Monthly Bars */
    .monthly-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .monthly-row .month-label {
      width: 80px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }
    .monthly-row .bar-container {
      flex: 1;
      height: 22px;
      background: #f1f5f9;
      border-radius: 6px;
      overflow: hidden;
    }
    .monthly-row .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0F2B5B, #1e40af);
      border-radius: 6px;
      transition: width 0.3s;
    }
    .monthly-row .bar-value {
      width: 100px;
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .monthly-row .bar-count {
      width: 40px;
      text-align: right;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f8fafc;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      padding: 10px 14px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }
    th.right, td.right { text-align: right; }
    td {
      padding: 10px 14px;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    td.bold { font-weight: 700; color: #0f172a; }
    tr:last-child td { border-bottom: none; }

    /* Two-col grid */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }
    .card h3 {
      font-size: 14px;
      font-weight: 700;
      color: #0F2B5B;
      margin-bottom: 14px;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .breakdown-row:last-child { border-bottom: none; }
    .breakdown-row .name { color: #475569; }
    .breakdown-row .amount { font-weight: 600; color: #0f172a; }

    /* Footer */
    .report-footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Print */
    @media print {
      body { background: white; }
      .container { padding: 20px 16px; }
      .kpi-grid { grid-template-columns: repeat(4, 1fr); }
      .no-print { display: none !important; }
      @page {
        size: A4;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <div style="display:flex;align-items:center;gap:16px;">
        <img src="${logoUrl}" alt="AATA Logo" style="height:48px;width:auto;" />
        <div>
          <h1>Financial Report</h1>
          <div class="subtitle">${periodLabel} — Aerojet Aviation Training Academy</div>
        </div>
      </div>
      <div class="meta">
        <div>Generated: ${generatedAt}</div>
        <div style="margin-top: 8px; display: flex; gap: 8px;">
          <button class="no-print" onclick="window.print()" style="
            padding: 8px 20px; background: #0F2B5B; color: white; border: none;
            border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          ">🖨️ Save as PDF</button>
        </div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card accent">
        <div class="label">Year Revenue</div>
        <div class="value">${formatEUR(summary.totalRevenue)}</div>
        <div class="detail">${summary.totalCount} transactions</div>
      </div>
      <div class="kpi-card">
        <div class="label">Selected Month</div>
        <div class="value">${formatEUR(summary.revenueThisMonth)}</div>
        <div class="detail">${summary.monthCount} transactions</div>
      </div>
      <div class="kpi-card warning">
        <div class="label">Pending</div>
        <div class="value">${formatEUR(summary.pendingAmount)}</div>
        <div class="detail">${summary.pendingCount} awaiting</div>
      </div>
      <div class="kpi-card">
        <div class="label">Avg Transaction</div>
        <div class="value">${formatEUR(summary.avgTransactionValue)}</div>
        <div class="detail">per approved payment</div>
      </div>
    </div>

    <div class="section-title">Monthly Revenue Breakdown — ${year || new Date().getFullYear()}</div>
    ${monthlyData
      .map(
        (m) => `
      <div class="monthly-row">
        <span class="month-label">${m.month}</span>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${((m.revenue / maxMonthlyRevenue) * 100).toFixed(1)}%"></div>
        </div>
        <span class="bar-value">${formatEUR(m.revenue)}</span>
        <span class="bar-count">${m.count}</span>
      </div>`
      )
      .join('')}

    <div class="two-col">
      <div class="card">
        <h3>Revenue by Programme Type</h3>
        ${revenueByType
          .filter((r) => r.value > 0)
          .sort((a, b) => b.value - a.value)
          .map(
            (r) => `
          <div class="breakdown-row">
            <span class="name">${r.name}</span>
            <span class="amount">${formatEUR(r.value)} (${r.percentage}%)</span>
          </div>`
          )
          .join('') || '<div style="padding:16px 0;color:#94a3b8;text-align:center;">No data</div>'}
      </div>
      <div class="card">
        <h3>Payment Status</h3>
        ${paymentStatus
          .map(
            (s) => `
          <div class="breakdown-row">
            <span class="name">${s.status}</span>
            <span class="amount">${formatEUR(s.amount)} · ${s.count} txs</span>
          </div>`
          )
          .join('')}
      </div>
    </div>

    <div class="section-title">Payment Methods</div>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th class="right">Count</th>
          <th class="right">Amount</th>
          <th class="right">%</th>
        </tr>
      </thead>
      <tbody>
        ${paymentMethods
          .map(
            (m) => `
        <tr>
          <td>${m.method.replace(/_/g, ' ')}</td>
          <td class="right">${m.count}</td>
          <td class="right bold">${formatEUR(m.amount)}</td>
          <td class="right">${m.percentage}%</td>
        </tr>`
          )
          .join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:24px;">No data</td></tr>'}
      </tbody>
    </table>

    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="kpi-card success">
        <div class="label">Success Rate</div>
        <div class="value">${
          summary.totalCount + summary.rejectedCount > 0
            ? Math.round((summary.totalCount / (summary.totalCount + summary.rejectedCount)) * 100)
            : 0
        }%</div>
      </div>
      <div class="kpi-card">
        <div class="label">Rejected / Failed</div>
        <div class="value" style="color:#dc2626;">${formatEUR(summary.rejectedAmount)}</div>
        <div class="detail">${summary.rejectedCount} transactions</div>
      </div>
      <div class="kpi-card accent">
        <div class="label">Year Total</div>
        <div class="value">${formatEUR(summary.revenueThisYear)}</div>
        <div class="detail">${summary.yearCount} approved</div>
      </div>
    </div>

    <div class="report-footer">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${logoUrl}" alt="AATA" style="height:20px;width:auto;opacity:0.5;" />
        <span>Aerojet Aviation Training Academy — Confidential</span>
      </div>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('[FINANCE_REPORT_EXPORT]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
