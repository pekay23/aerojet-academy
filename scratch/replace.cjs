const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Projects\\aerojet-academy', 'lib', 'analytics', 'reports.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace in getFinanceReportSummary
content = content.replace(
  `  const monthRevenueResult = await prisma.payment.aggregate({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
    _count: { id: true },
  })`,
  `  const monthRevenueResult = await prisma.payment.aggregate({
    where: {
      status: 'APPROVED',
      OR: [
        { approvedAt: { gte: startOfMonth } },
        { approvedAt: null, createdAt: { gte: startOfMonth } }
      ]
    },
    _sum: { amount: true },
    _count: { id: true },
  })`
);

content = content.replace(
  `  const yearRevenueResult = await prisma.payment.aggregate({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: startOfYear },
    },
    _sum: { amount: true },
    _count: { id: true },
  })`,
  `  const yearRevenueResult = await prisma.payment.aggregate({
    where: {
      status: 'APPROVED',
      OR: [
        { approvedAt: { gte: startOfYear } },
        { approvedAt: null, createdAt: { gte: startOfYear } }
      ]
    },
    _sum: { amount: true },
    _count: { id: true },
  })`
);

// Replace in getMonthlyRevenueData
content = content.replace(
  `  const payments = await prisma.payment.findMany({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: twelveMonthsAgo },
    },
    select: { amount: true, approvedAt: true },
  })`,
  `  const payments = await prisma.payment.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { approvedAt: { gte: twelveMonthsAgo } },
        { approvedAt: null, createdAt: { gte: twelveMonthsAgo } }
      ]
    },
    select: { amount: true, approvedAt: true, createdAt: true },
  })`
);

content = content.replace(
  `  for (const payment of payments) {
    if (!payment.approvedAt) continue
    const d = new Date(payment.approvedAt)`,
  `  for (const payment of payments) {
    const dateToUse = payment.approvedAt || payment.createdAt;
    if (!dateToUse) continue;
    const d = new Date(dateToUse)`
);

fs.writeFileSync(filePath, content);
console.log('Replaced content in reports.ts successfully');
