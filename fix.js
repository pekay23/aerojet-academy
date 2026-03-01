const fs = require('fs');
let code = fs.readFileSync('prisma/seed.ts', 'utf-8');
code = code.replace(/semester1StartDate: new Date\(y\.sem1\),\s*semester2StartDate: new Date\(y\.sem2\),/g, "semesters: [{name: 'Semester 1', startDate: new Date(y.sem1).toISOString(), endDate: new Date(y.sem1).toISOString()}, {name: 'Semester 2', startDate: new Date(y.sem2).toISOString(), endDate: new Date(y.sem2).toISOString()}],");
fs.writeFileSync('prisma/seed.ts', code);
