import fs from 'fs';

function updateStudentPage() {
  const path = 'app/staff/students/[id]/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Insert slugify helper and lookup logic before prisma.user.findUnique
  const lookupLogic = `
  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
  }

  // Find user by slug first
  const allUsers = await prisma.user.findMany({
    where: { role: { in: ['STUDENT', 'APPLICANT'] } },
    select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } }
  });

  const matchedUser = allUsers.find(u => {
    const name = u.profile ? \`\${u.profile.firstName} \${u.profile.lastName}\` : u.email.split('@')[0];
    return slugify(name) === id;
  });

  const targetId = matchedUser ? matchedUser.id : id;

  // Fetch comprehensive student data
  const student = await prisma.user.findUnique({
    where: { id: targetId, role: { in: ['STUDENT', 'APPLICANT'] } },`;

  content = content.replace(
    /\/\/ Fetch comprehensive student data\s+const student = await prisma\.user\.findUnique\(\{\s+where: \{ id, role: \{ in: \['STUDENT', 'APPLICANT'\] \} \},/m,
    lookupLogic
  );

  // also update targetId for fullTimeEnrollments and modularEnrollments
  content = content.replace(/where: \{ studentId: id \},/g, 'where: { studentId: targetId },');

  fs.writeFileSync(path, content);
}

function updateStudentLink() {
  const path = 'app/staff/_components/StudentDetailPanel.tsx';
  let content = fs.readFileSync(path, 'utf8');

  const slugifyFunc = `
function slugify(text: string) {
  return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
}
`;

  if (!content.includes('function slugify')) {
    content = content.replace(/export default function StudentDetailPanel/, slugifyFunc + '\nexport default function StudentDetailPanel');
  }

  content = content.replace(
    /href=\{\`\/staff\/students\/\$\{currentStudent\.id\}\`\}/g,
    "href={`/staff/students/${slugify(currentStudent.profile ? `${currentStudent.profile.firstName} ${currentStudent.profile.lastName}` : currentStudent.email.split('@')[0])}`}"
  );

  fs.writeFileSync(path, content);
}

updateStudentPage();
updateStudentLink();
console.log('Fixed Staff Students');
