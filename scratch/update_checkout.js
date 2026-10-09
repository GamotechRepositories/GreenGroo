const fs = require('fs');
const file = 'frontend/src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '{/* Home delivery or store pickup */}';
const endStr = '{/* Address */}';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// Replace address title and step
content = content.replace(
  'title={isPickup ? "Your details" : "Delivery address"}\n                    stepNumber="2"',
  'title="Delivery address"\n                    stepNumber="1"'
);

// Replace pre-order title and step
content = content.replace(
  'title={isPickup ? "Pre-order pickup slot (tomorrow)" : "Pre-order delivery slot (tomorrow)"}\n                      stepNumber="3"',
  'title="Pre-order delivery slot (tomorrow)"\n                      stepNumber="2"'
);

// Replace payment step
content = content.replace(
  'stepNumber={hasPreOrderItems ? "4" : "3"}',
  'stepNumber={hasPreOrderItems ? "3" : "2"}'
);

// Replace delivery instructions title and step
content = content.replace(
  'stepNumber={hasPreOrderItems ? "5" : "4"}',
  'stepNumber={hasPreOrderItems ? "4" : "3"}'
);
content = content.replace(
  'title={isPickup ? "Note for the store" : "Delivery instructions"}',
  'title="Delivery instructions"'
);

fs.writeFileSync(file, content);
console.log('Checkout updated successfully');
