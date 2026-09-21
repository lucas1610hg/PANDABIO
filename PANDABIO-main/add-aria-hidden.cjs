const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Extract imports from lucide-react to know which tags are icons
  const lucideImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
  if (!lucideImportMatch) return; // no icons in this file

  let iconNamesRaw = lucideImportMatch[1];
  // Deal with multi-line imports and clean them
  iconNamesRaw = iconNamesRaw.replace(/\n/g, ' ').replace(/\r/g, '');
  const iconNames = iconNamesRaw.split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
  
  if (iconNames.length === 0) return;

  // We are looking for Lucide icons like <IconName className="w-5 h-5..." />
  const regex = new RegExp(`(<(${iconNames.join('|')}))(\\s+[^>]*\\/?>)`, 'g');

  content = content.replace(regex, (match, p1, p2, p3) => {
    // If it already has aria-hidden or aria-label, leave it alone
    if (p3.includes('aria-hidden') || p3.includes('aria-label')) {
      return match;
    }
    // Check if there is already some prop, insert aria-hidden="true" right after the tag name
    return `${p1} aria-hidden="true"${p3}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
