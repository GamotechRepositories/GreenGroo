const fs = require('fs');
const file = 'frontend/src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update main tag for edge-to-edge on mobile and bottom padding
content = content.replace(
  '<main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:px-8">',
  '<main className="mx-auto max-w-7xl px-0 sm:px-4 py-2 sm:py-6 lg:px-8 pb-32 sm:pb-8">'
);

// 2. Update StepSection for edge-to-edge
// Wait, replacing all StepSections might be tricky because there are multiple.
// Let's replace the definition of StepSection.
const stepSectionDef = 'function StepSection({ title, stepNumber, icon, children }) {\n  return (\n    <div className="group/section overflow-hidden rounded-xl border border-border-light bg-white shadow-sm transition-all hover:shadow-md">';
const newStepSectionDef = 'function StepSection({ title, stepNumber, icon, children }) {\n  return (\n    <div className="group/section overflow-hidden rounded-none sm:rounded-xl border-y sm:border border-border-light bg-white shadow-sm transition-all hover:shadow-md">';
content = content.replace(stepSectionDef, newStepSectionDef);

// 3. Update Order Summary container for edge-to-edge
const orderSummaryContainer = '<div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-sm lg:sticky lg:top-24">';
const newOrderSummaryContainer = '<div className="overflow-hidden rounded-none sm:rounded-xl border-y sm:border border-border-light bg-white shadow-sm lg:sticky lg:top-24 mb-6 lg:mb-0">';
content = content.replace(orderSummaryContainer, newOrderSummaryContainer);

// 4. Find the Place Order button and wrap it properly.
const placeOrderText = 'onClick={handlePlaceOrder}';
const buttonStartIdx = content.lastIndexOf('<button', content.indexOf(placeOrderText));
const buttonEndIdx = content.indexOf('</button>', content.indexOf(placeOrderText)) + '</button>'.length;

if (buttonStartIdx !== -1 && buttonEndIdx > buttonStartIdx) {
  let buttonCode = content.substring(buttonStartIdx, buttonEndIdx);
  // Remove mt-3 and sm:mt-5 from button code
  buttonCode = buttonCode.replace('mt-3 ', '').replace(' sm:mt-5', '');
  const wrappedButton = '<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] lg:static lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:mt-5">\\n' +
                        buttonCode +
                        '\\n</div>';
  content = content.substring(0, buttonStartIdx) + wrappedButton + content.substring(buttonEndIdx);
}

// 5. Cleanup setMessage and setFulfillment since they are unused
content = content.replace('const [message, setMessage] = useState("");', 'const [message] = useState("");');
content = content.replace('const [fulfillment, setFulfillment] = useState(FULFILLMENT.DELIVERY);', 'const [fulfillment] = useState(FULFILLMENT.DELIVERY);');

fs.writeFileSync(file, content);
console.log('Mobile layout changes applied successfully');
