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

const files = walk(path.join(__dirname, '../app/api'));
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    let safeContent = original;
    safeContent = safeContent.replace(/\(session\.user as any\)/g, 'session.user');
    safeContent = safeContent.replace(/\(session\?\.user as any\)/g, 'session?.user');
    safeContent = safeContent.replace(/\(staff as any\)/g, 'staff');
    safeContent = safeContent.replace(/\(validation as any\)/g, 'validation');
    safeContent = safeContent.replace(/validation\.data as any/g, 'validation.data');
    safeContent = safeContent.replace(/bookingType as any/g, 'bookingType');
    safeContent = safeContent.replace(/'USER_UPDATE' as any/g, "'USER_UPDATE'");
    safeContent = safeContent.replace(/'SYSTEM_UPDATE' as any/g, "'SYSTEM_UPDATE'");
    safeContent = safeContent.replace(/'COMPLETED' as any/g, "'COMPLETED'");
    safeContent = safeContent.replace(/'PENDING' as any/g, "'PENDING'");
    safeContent = safeContent.replace(/status: status as any/g, 'status: status');

    if (original !== safeContent) {
        fs.writeFileSync(file, safeContent, 'utf8');
        count++;
    }
});

console.log('Fixed files:', count);
