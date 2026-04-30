import fs from 'fs';

function updateApplicantCoursesPage() {
  const path = 'app/applicant/courses/[id]/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  const lookupLogic = `
  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
  }

  const allCourses = await prisma.course.findMany({ select: { id: true, name: true, code: true } });
  const matchedCourse = allCourses.find(c => slugify(c.name) === id || slugify(c.code) === id);
  const targetId = matchedCourse ? matchedCourse.id : id;

  const [course, enrollment] = await Promise.all([
    prisma.course.findUnique({
      where: { id: targetId },
      include: { category: true },
    }),
    prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: targetId,
      },
    }),
  ])`;

  if (!content.includes('const matchedCourse = allCourses.find(')) {
    content = content.replace(
      /const \[course, enrollment\] = await Promise\.all\(\[\n\s+prisma\.course\.findUnique\(\{\n\s+where: \{ id \},\n\s+include: \{ category: true \},\n\s+\}\),\n\s+prisma\.enrollment\.findFirst\(\{\n\s+where: \{\n\s+userId,\n\s+courseId: id,\n\s+\},\n\s+\}\),\n\s+\]\)/m,
      lookupLogic
    );

    // update the rest
    content = content.replace(/courseId: id/g, 'courseId: targetId');
    content = content.replace(/courses\/\$\{id\}/g, 'courses/${targetId}');
    fs.writeFileSync(path, content);
  }
}

function updateApplicantCoursesLinks() {
  const path = 'app/applicant/courses/page.tsx';
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');

    const slugifyFunc = `
function slugify(text: string) {
  return text?.toString().toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-') || '';
}
`;

    if (!content.includes('function slugify')) {
      content = content.replace(/export default async function/, slugifyFunc + '\nexport default async function');
    }

    content = content.replace(
      /href=\{\`\/applicant\/courses\/\$\{course\.id\}\`\}/g,
      "href={`/applicant/courses/${slugify(course.name) || course.id}`}"
    );

    fs.writeFileSync(path, content);
  }
}

updateApplicantCoursesPage();
updateApplicantCoursesLinks();
console.log('Fixed Applicant Courses');
