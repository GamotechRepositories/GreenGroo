const fs = require('fs');
const file = 'frontend/src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Constrain main to viewport
content = content.replace(
  '<main className="mx-auto max-w-7xl px-0 sm:px-4 py-2 sm:py-6 lg:px-8 pb-32 sm:pb-8">',
  '<main className="mx-auto max-w-7xl px-0 sm:px-4 py-2 sm:py-6 lg:px-8 pb-32 sm:pb-8 w-full max-w-[100vw] overflow-x-hidden">'
);

// 2. Add min-w-0 to grid to prevent flex blowout
content = content.replace(
  '<div className="grid items-start gap-3 sm:gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">',
  '<div className="grid items-start gap-3 sm:gap-6 lg:grid-cols-[1fr_380px] lg:gap-8 w-full min-w-0">'
);

// 3. Constrain the left column
content = content.replace(
  '<div className="space-y-3 sm:space-y-4">',
  '<div className="space-y-3 sm:space-y-4 w-full min-w-0 overflow-hidden">'
);

// 4. Force Address summary items to wrap or truncate and prevent breaking
content = content.replace(
  '<div className="flex flex-wrap items-center gap-2">',
  '<div className="flex flex-wrap items-center gap-2 w-full min-w-0">'
);

fs.writeFileSync(file, content);
console.log('Responsiveness fixes applied');
