const fs = require('fs');
const path = 'c:/Users/saura/OneDrive/Desktop/company/GreenGroo/admin/src/pages/Categories.jsx';
let s = fs.readFileSync(path, 'utf8');
const marker = '  return (\n    <div className="space-y-4 max-w-7xl mx-auto pb-12">';
const idx = s.lastIndexOf(marker);
if (idx < 0) {
  console.error('marker not found');
  process.exit(1);
}
const before = s.slice(0, idx);
const next = fs.readFileSync('c:/Users/saura/OneDrive/Desktop/company/GreenGroo/admin/src/pages/_CategoriesMainReturn.jsx.snippet', 'utf8');
fs.writeFileSync(path, before + next);
console.log('ok', (before + next).split(/\n/).length);
