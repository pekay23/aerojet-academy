import fs from 'fs';

function updateUsersPage() {
  const path = 'app/staff/users/[id]/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  const lookupLogic = `
  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
  }

  // Find user by slug first
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } }
  });

  const matchedUser = allUsers.find(u => {
    const name = u.profile ? \`\${u.profile.firstName} \${u.profile.lastName}\` : u.email.split('@')[0];
    return slugify(name) === id;
  });

  const targetId = matchedUser ? matchedUser.id : id;

  const userRaw = await prisma.user.findUnique({
    where: { id: targetId },`;

  if (!content.includes('const matchedUser = allUsers.find(u => {')) {
    content = content.replace(
      /const userRaw = await prisma\.user\.findUnique\(\{\s+where: \{ id \},/m,
      lookupLogic
    );
  }

  fs.writeFileSync(path, content);
}

function updateUsersLink() {
  const path1 = 'app/staff/_components/UserActionsMenu.tsx';
  let content1 = fs.readFileSync(path1, 'utf8');

  const slugifyFunc = `
function slugify(text: string) {
  return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
}
`;

  if (!content1.includes('function slugify')) {
    content1 = content1.replace(/export default function UserActionsMenu/, slugifyFunc + '\nexport default function UserActionsMenu');
  }

  content1 = content1.replace(
    /href: \`\/staff\/users\/\$\{userId\}\`/g,
    "href: `/staff/users/${slugify(userName) || userId}`"
  );

  fs.writeFileSync(path1, content1);

  const path2 = 'app/staff/_components/InstructorsTable.tsx';
  let content2 = fs.readFileSync(path2, 'utf8');

  if (!content2.includes('function slugify')) {
    content2 = content2.replace(/export default function InstructorsTable/, slugifyFunc + '\nexport default function InstructorsTable');
  }

  content2 = content2.replace(
    /href=\{\`\/staff\/users\/\$\{instructor\.id\}\`\}/g,
    "href={`/staff/users/${slugify(instructor.profile ? `${instructor.profile.firstName} ${instructor.profile.lastName}` : instructor.email.split('@')[0])}`}"
  );

  fs.writeFileSync(path2, content2);
}

updateUsersPage();
updateUsersLink();
console.log('Fixed Staff Users');
