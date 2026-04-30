import fs from 'fs';

function updateStaffClassesPage() {
  const path = 'app/staff/classes/[id]/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  const lookupLogic = `
  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
  }

  const allClasses = await prisma.class.findMany({ select: { id: true, name: true } });
  const matchedClass = allClasses.find(c => slugify(c.name) === id);
  const targetId = matchedClass ? matchedClass.id : id;

  const currentClass = await prisma.class.findUnique({
    where: { id: targetId },`;

  if (!content.includes('const matchedClass = allClasses.find(c => slugify(c.name) === id);')) {
    content = content.replace(
      /const currentClass = await prisma\.class\.findUnique\(\{\s+where: \{ id \},/m,
      lookupLogic
    );
  }

  // Also update `export async function generateMetadata({ params }...` if it exists and uses id
  if (content.includes('export async function generateMetadata')) {
    content = content.replace(
      /const currentClass = await prisma\.class\.findUnique\(\{\s+where: \{ id \},\s+select: \{ name: true \},\s+\}\)/m,
      `
  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
  }
  const allClasses = await prisma.class.findMany({ select: { id: true, name: true } });
  const matchedClass = allClasses.find(c => slugify(c.name) === id);
  const targetId = matchedClass ? matchedClass.id : id;
  const currentClass = await prisma.class.findUnique({
    where: { id: targetId },
    select: { name: true },
  })`
    );
  }

  fs.writeFileSync(path, content);
}

function updateInstructorClassesPage() {
  const path = 'app/instructor/classes/[id]/page.tsx';
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');

    const lookupLogic = `
  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
  }

  const allClasses = await prisma.class.findMany({ select: { id: true, name: true } });
  const matchedClass = allClasses.find(c => slugify(c.name) === id);
  const targetId = matchedClass ? matchedClass.id : id;

  const classData = await prisma.class.findUnique({
    where: { id: targetId },`;

    if (!content.includes('const matchedClass = allClasses.find(c => slugify(c.name) === id);')) {
      content = content.replace(
        /const classData = await prisma\.class\.findUnique\(\{\s+where: \{ id \},/m,
        lookupLogic
      );
    }
    fs.writeFileSync(path, content);
  }
}

function updateClassLinks() {
  const files = [
    'app/staff/_components/ClassActionsMenu.tsx',
    'app/staff/courses/[id]/page.tsx',
    'app/instructor/classes/page.tsx',
  ];

  const slugifyFunc = `
function slugify(text: string) {
  return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
}
`;

  files.forEach(path => {
    if (fs.existsSync(path)) {
      let content = fs.readFileSync(path, 'utf8');
      let changed = false;

      if (!content.includes('function slugify')) {
        content = content.replace(/export default function/, slugifyFunc + '\nexport default function');
        changed = true;
      }

      if (path.includes('ClassActionsMenu')) {
        content = content.replace(/href: \`\/staff\/classes\/\$\{classId\}\`/g, "href: `/staff/classes/${slugify(className) || classId}`");
        content = content.replace(/href: \`\/staff\/classes\/\$\{classId\}\/edit\`/g, "href: `/staff/classes/${slugify(className) || classId}/edit`");
        changed = true;
      }

      if (path.includes('courses/[id]/page.tsx')) {
        content = content.replace(/href=\{\`\/staff\/classes\/\$\{cls\.id\}\`\}/g, "href={`/staff/classes/${slugify(cls.name)}`}");
        changed = true;
      }

      if (path.includes('instructor/classes/page.tsx')) {
        content = content.replace(/href=\{\`\/instructor\/classes\/\$\{cls\.id\}\`\}/g, "href={`/instructor/classes/${slugify(cls.name)}`}");
        changed = true;
      }

      if (changed) fs.writeFileSync(path, content);
    }
  });
}

updateStaffClassesPage();
updateInstructorClassesPage();
updateClassLinks();
console.log('Fixed Classes');
