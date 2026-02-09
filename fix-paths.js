const fs = require('fs');
const path = require('path');

// The folder where your marketing components actually live now
const TARGET_DIR = '@/app/components/marketing';

// List of components that moved to the 'marketing' folder
const marketingComponents = [
  'Navbar', 'Footer', 'Hero', 'HeroSlider', 'PageHero', 
  'AdmissionsProcess', 'Credibility', 'Services', 'ProgramsSnapshot', 
  'PortalHighlights', 'WhoWeAre', 'NextSteps', 'NewsroomTeaser', 
  'HomeContact', 'ContactForm', 'RegisterForm', 'CommandMenu', 
  'MobileStickyBar', 'ScrollToTop', 'SignOutButton', 'ThemeToggle', 'Reveal'
];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('./app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  marketingComponents.forEach(component => {
    // Regex to match imports like:
    // import X from '@/components/X'
    // import X from '@/app/components/X'
    // AND ensure we don't double-fix lines that are already correct.
    
    // Pattern 1: Fix old root imports "@/components/X"
    const regex1 = new RegExp(`@/components/${component}(?=['";])`, 'g');
    content = content.replace(regex1, `${TARGET_DIR}/${component}`);

    // Pattern 2: Fix incomplete app imports "@/app/components/X" (missing 'marketing')
    // We use a negative lookahead (?!/marketing) to ensure we don't break already fixed paths
    const regex2 = new RegExp(`@/app/components/${component}(?!/marketing)(?=['";])`, 'g');
    content = content.replace(regex2, `${TARGET_DIR}/${component}`);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed imports in: ${file}`);
  }
});

console.log("🎉 Import fix complete!");
