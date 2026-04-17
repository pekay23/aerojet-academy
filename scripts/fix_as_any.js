const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

// Target the entire app/ directory
const files = walk(path.join(__dirname, '../app'));
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // React Component fixes
    let safeContent = original;
    
    // Auth & Session
    safeContent = safeContent.replace(/\(session\.user as any\)\.id/g, 'session.user.id');
    safeContent = safeContent.replace(/\(session\.user as any\)\.name/g, 'session.user.name');
    safeContent = safeContent.replace(/\(session\.user as any\)/g, 'session.user');
    safeContent = safeContent.replace(/\(session\?\.user as any\)\?\.role/g, 'session?.user?.role');
    safeContent = safeContent.replace(/\(session\?\.user as any\)/g, 'session?.user');
    
    // Serialized Prisma
    safeContent = safeContent.replace(/serializePrisma\(course\) as any/g, 'serializePrisma(course)');
    safeContent = safeContent.replace(/serializePrisma\(categories\) as any/g, 'serializePrisma(categories)');
    
    // Prop drilling bypassing
    safeContent = safeContent.replace(/logs=\{logs as any\}/g, 'logs={logs}');
    safeContent = safeContent.replace(/initialHistory=\{history as any\}/g, 'initialHistory={history}');
    safeContent = safeContent.replace(/initialQueue=\{queue as any\}/g, 'initialQueue={queue}');
    safeContent = safeContent.replace(/initialData=\{profile as any\}/g, 'initialData={profile}');
    safeContent = safeContent.replace(/instructors=\{instructors as any\}/g, 'instructors={instructors}');
    safeContent = safeContent.replace(/requests=\{pendingRequests as any\}/g, 'requests={pendingRequests}');
    
    // MiddleName from Profile fixes
    safeContent = safeContent.replace(/\(s as any\)\.middleName/g, 's.middleName');
    safeContent = safeContent.replace(/\(selectedStudent as any\)\.middleName/g, 'selectedStudent.middleName');
    
    // Other safe removals
    safeContent = safeContent.replace(/\(studentProfile\?\.enrollmentType as any\)/g, 'studentProfile?.enrollmentType');
    safeContent = safeContent.replace(/\(y\.semesters as any\)/g, 'y.semesters');
    safeContent = safeContent.replace(/\(user\.studentProfile\?\.pathwayRel\?\.code as any\)/g, 'user.studentProfile?.pathwayRel?.code');
    safeContent = safeContent.replace(/selectedProgramme: undefined as any/g, 'selectedProgramme: undefined');

    if (original !== safeContent) {
        fs.writeFileSync(file, safeContent, 'utf8');
        count++;
    }
});

console.log('Fixed files:', count);
