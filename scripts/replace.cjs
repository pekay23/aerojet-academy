const fs = require('fs');
const file = 'c:/Projects/aerojet-academy/app/staff/students/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  // Serialize data for client components
  const serializedStudent = serializePrisma({
    ...student,
    password: undefined,
    walletTransactions,
    fullTimeEnrollments,`;

const replacement = `  // Resolve staff names for transactions and payments
  const staffIds = new Set<string>()
  walletTransactions.forEach((t) => t.createdBy && staffIds.add(t.createdBy))
  student.payments?.forEach((p) => p.approvedBy && staffIds.add(p.approvedBy))

  const staffUsers =
    staffIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(staffIds) } },
          select: { id: true, profile: { select: { firstName: true, lastName: true } } },
        })
      : []

  const staffMap = Object.fromEntries(
    staffUsers.map((u) => [
      u.id,
      u.profile ? \`\${u.profile.firstName} \${u.profile.lastName}\` : 'Staff',
    ])
  )

  const enrichedWalletTransactions = walletTransactions.map((t) => ({
    ...t,
    staffName: t.createdBy ? staffMap[t.createdBy] : null,
  }))

  const enrichedPayments = student.payments?.map((p) => ({
    ...p,
    staffName: p.approvedBy ? staffMap[p.approvedBy] : null,
  })) || []

  // Serialize data for client components
  const serializedStudent = serializePrisma({
    ...student,
    password: undefined,
    walletTransactions: enrichedWalletTransactions,
    payments: enrichedPayments,
    fullTimeEnrollments,`;

const targetLf = target.replace(/\r\n/g, '\n');
const targetCrLf = targetLf.replace(/\n/g, '\r\n');

if (content.includes(targetLf)) {
  fs.writeFileSync(file, content.replace(targetLf, replacement));
  console.log('Success with LF');
} else if (content.includes(targetCrLf)) {
  fs.writeFileSync(file, content.replace(targetCrLf, replacement));
  console.log('Success with CRLF');
} else {
  console.log('Target entirely missing');
}
