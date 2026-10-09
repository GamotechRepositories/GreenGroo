const fs = require('fs');
const file = 'frontend/src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update main tag for edge-to-edge on mobile and bottom padding
content = content.replace(
  '<main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:px-8">',
  '<main className="mx-auto max-w-7xl px-0 sm:px-4 py-2 sm:py-6 lg:px-8 pb-32 sm:pb-8">'
);

// 2. Update StepSection for edge-to-edge
content = content.replace(
  '<div className="group/section overflow-hidden rounded-xl border border-border-light bg-white shadow-sm transition-all hover:shadow-md">',
  '<div className="group/section overflow-hidden rounded-none sm:rounded-xl border-y sm:border border-border-light bg-white shadow-sm transition-all hover:shadow-md">'
);

// 3. Update Order Summary container for edge-to-edge
content = content.replace(
  '<div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-sm lg:sticky lg:top-24">',
  '<div className="overflow-hidden rounded-none sm:rounded-xl border-y sm:border border-border-light bg-white shadow-sm lg:sticky lg:top-24 mb-6 lg:mb-0">'
);

// 4. Wrap the Place Order button in a sticky mobile footer
const buttonRegex = /<button[\s\S]*?onClick=\{handlePlaceOrder\}[\s\S]*?<\/button>/;
const buttonMatch = content.match(buttonRegex);

if (buttonMatch && !content.includes('lg:static lg:border-none lg:bg-transparent')) {
  let buttonCode = buttonMatch[0];
  // Remove mt-3 / sm:mt-5 from button class to let the wrapper handle spacing on mobile
  buttonCode = buttonCode.replace('mt-3 ', '').replace(' sm:mt-5', '');
  
  const wrappedButton = '<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] lg:static lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:mt-5">\n' +
                        buttonCode +
                        '\n</div>';
  content = content.replace(buttonRegex, wrappedButton);
}

fs.writeFileSync(file, content);
console.log('Checkout layout updated for mobile');
