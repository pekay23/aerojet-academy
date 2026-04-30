import fs from 'fs';

function updateStudentExamsLinks() {
  const files1 = [
    'app/student/page.tsx',
    'app/student/wallet/page.tsx',
    'app/student/exam-bookings/[id]/page.tsx' // wait, I didn't rename exam-bookings to [slug]! I'll do that too
  ];

  files1.forEach(f => {
    if (fs.existsSync(f)) {
      let c = fs.readFileSync(f, 'utf8');
      c = c.replace(/href="\/student\/exams"/g, 'href="/student/exams?tab=records"');
      fs.writeFileSync(f, c);
    }
  });

  const sidebar = 'app/student/_components/StudentSidebar.tsx';
  if (fs.existsSync(sidebar)) {
    let c = fs.readFileSync(sidebar, 'utf8');
    c = c.replace(/href: '\/student\/exams'/g, "href: '/student/exams?tab=records'");
    fs.writeFileSync(sidebar, c);
  }
}

updateStudentExamsLinks();
console.log('Fixed links');
