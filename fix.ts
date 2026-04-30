import fs from 'fs';

const path = 'app/student/courses/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/params: Promise<\{ id: string \}>/g, 'params: Promise<{ slug: string }>');
content = content.replace(/const \{ id \} = await params/g, 'const { slug } = await params');
content = content.replace(
  /const enrollment = await prisma\.enrollment\.findUnique\(\{\s+where: \{ id \},\s+include: \{ course: true \},\s+\}\)/g,
  `const enrollments = await prisma.enrollment.findMany({ where: { userId: session.user.id }, include: { course: true } });\n  const enrollment = enrollments.find(e => e.course.name.toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') === slug);`
);

content = content.replace(
  /const enrollment = await prisma\.enrollment\.findUnique\(\{\s+where: \{ id \},/g,
  `const allEnrollments = await prisma.enrollment.findMany({ where: { userId: session.user.id },`
);

content = content.replace(
  /if \(!enrollment \|\| enrollment\.userId !== session\.user\.id\)/g,
  `const enrollment = allEnrollments.find(e => e.course.name.toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') === slug);\n\n  if (!enrollment || enrollment.userId !== session.user.id)`
);

fs.writeFileSync(path, content);
console.log('Fixed');
