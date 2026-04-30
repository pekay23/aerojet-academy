const fs = require('fs');
['app/staff/calendar/_components/StaffCalendarGrid.tsx', 'app/instructor/schedule/_components/CalendarGrid.tsx'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(f, content);
});
