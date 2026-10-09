const fs = require('fs');
const file = 'frontend/src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace literal \n in the JSX
content = content.replace(/\\n<button/g, '<button');
content = content.replace(/<\/button>\\n<\/div>/g, '</button></div>');

// Ensure the main outer wrapper doesn't overflow horizontally on mobile
content = content.replace('<div className="min-h-screen bg-mobile-bg text-text-primary">', '<div className="min-h-screen bg-mobile-bg text-text-primary overflow-x-hidden">');

// Add break-words to the address texts
content = content.replace(
  '<p className="mt-2 pl-10 text-text-secondary">{formatAddressLine(address)}</p>',
  '<p className="mt-2 pl-10 text-text-secondary break-words overflow-hidden">{formatAddressLine(address)}</p>'
);

content = content.replace(
  '<p className="mt-1 text-text-secondary">{formatAddressLine(addr)}</p>',
  '<p className="mt-1 text-text-secondary break-words overflow-hidden">{formatAddressLine(addr)}</p>'
);

// Add break-words to Address title as well just in case
content = content.replace(
  '<p className="font-semibold text-text-primary">{getAddressFullName(address)}</p>',
  '<p className="font-semibold text-text-primary break-words overflow-hidden">{getAddressFullName(address)}</p>'
);

content = content.replace(
  '<p className="font-semibold text-text-primary">{getAddressFullName(addr)}</p>',
  '<p className="font-semibold text-text-primary break-words overflow-hidden">{getAddressFullName(addr)}</p>'
);


fs.writeFileSync(file, content);
console.log('Fixed \\n typos and added break-words to addresses.');
