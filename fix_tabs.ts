import fs from 'fs';

const pathTabs = 'app/student/exams/_components/ExamsTabs.tsx';
let cTabs = fs.readFileSync(pathTabs, 'utf8');

cTabs = cTabs.replace(
  /const ALL_TABS = \[[\s\S]*?\] as const/,
  `const ALL_TABS = [
  { key: 'records', label: 'Exam Records', shortLabel: 'Records', icon: History },
  { key: 'bookings', label: 'My Bookings', shortLabel: 'My Bookings', icon: FileCheck },
  { key: 'available', label: 'Join Pools', shortLabel: 'Pools', icon: Users },
  { key: 'individual', label: 'Individual', shortLabel: 'Individual', icon: User },
  { key: 'group', label: 'Group', shortLabel: 'Group', icon: Layers },
  { key: 'resit', label: 'Resit', shortLabel: 'Resit', icon: RefreshCcw },
] as const`
);

cTabs = cTabs.replace(
  /const HISTORY_ONLY_TABS = \[[\s\S]*?\] as const/,
  `const HISTORY_ONLY_TABS = [
  { key: 'records', label: 'Exam Records', shortLabel: 'Records', icon: History },
  { key: 'bookings', label: 'My Bookings', shortLabel: 'My Bookings', icon: FileCheck },
] as const`
);

cTabs = cTabs.replace(/searchParams\.get\('tab'\) \|\| 'available'/, `searchParams.get('tab') || 'records'`);

fs.writeFileSync(pathTabs, cTabs);

const pathPage = 'app/student/exams/page.tsx';
let cPage = fs.readFileSync(pathPage, 'utf8');

cPage = cPage.replace(/const tab = tabParam \|\| 'available'/, `const tab = tabParam || 'records'`);
cPage = cPage.replace(
  /const effectiveTab = validTabs\.includes\(tab\)\n    \? tab\n    : isFullTimeStudent\n      \? 'records'\n      : isExamOnly\n        \? 'available'\n        : 'records'/,
  `const effectiveTab = validTabs.includes(tab)
    ? tab
    : isFullTimeStudent
      ? 'records'
      : isExamOnly
        ? 'records'
        : 'records'`
);

fs.writeFileSync(pathPage, cPage);

console.log('Fixed Tabs');
