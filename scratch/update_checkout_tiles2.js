const fs = require('fs');
const file = 'frontend/src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add deliveryInstructions state
const statePattern = 'const [message, setMessage] = useState("");';
const newState = `const [message, setMessage] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState({
    avoidCalling: false,
    dontRingBell: false,
    leaveAtGuard: false
  });`;
if (!content.includes('deliveryInstructions')) {
  content = content.replace(statePattern, newState);
}

// 2. Modify orderMessage payload
const payloadPattern = 'orderMessage: message,';
const newPayload = `orderMessage: [
            deliveryInstructions.avoidCalling && "Avoid calling",
            deliveryInstructions.dontRingBell && "Don't ring the bell",
            deliveryInstructions.leaveAtGuard && "Leave at guard",
            message
          ].filter(Boolean).join(" | "),`;
if (!content.includes('deliveryInstructions.avoidCalling')) {
  content = content.replace(payloadPattern, newPayload);
}

// 3. Replace the textarea section
const startStr = 'title="Delivery instructions"';
const endStr = '{/* Right column';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  // Find the closing StepSection tag
  const sectionEndStr = '</StepSection>';
  const actualEndIndex = content.indexOf(sectionEndStr, startIndex) + sectionEndStr.length;

  const newSection = `title="Delivery instructions"
                  stepNumber={hasPreOrderItems ? "4" : "3"}
                  icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                >
                  <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {/* Record Tile */}
                    <button
                      type="button"
                      className="flex h-24 w-28 shrink-0 snap-start flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-1 text-[#0C831F]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Record</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 leading-tight">Press here<br/>and hold</span>
                    </button>

                    {/* Avoid calling */}
                    <button
                      type="button"
                      onClick={() => setDeliveryInstructions(p => ({ ...p, avoidCalling: !p.avoidCalling }))}
                      className={\`flex h-24 w-28 shrink-0 snap-start flex-col justify-between rounded-xl border p-3 text-left transition-colors \${
                        deliveryInstructions.avoidCalling 
                          ? "border-[#0C831F] bg-green-50/50" 
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }\`}
                    >
                      <div className="flex items-center justify-between">
                        <svg className={\`h-5 w-5 \${deliveryInstructions.avoidCalling ? "text-[#0C831F]" : "text-slate-500"}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className={\`h-4 w-4 rounded-[3px] border \${deliveryInstructions.avoidCalling ? "border-[#0C831F] bg-[#0C831F]" : "border-slate-300"}\`}>
                          {deliveryInstructions.avoidCalling && (
                            <svg className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={\`text-xs font-semibold leading-tight \${deliveryInstructions.avoidCalling ? "text-[#0C831F]" : "text-slate-700"}\`}>Avoid calling</span>
                    </button>

                    {/* Don't ring the bell */}
                    <button
                      type="button"
                      onClick={() => setDeliveryInstructions(p => ({ ...p, dontRingBell: !p.dontRingBell }))}
                      className={\`flex h-24 w-28 shrink-0 snap-start flex-col justify-between rounded-xl border p-3 text-left transition-colors \${
                        deliveryInstructions.dontRingBell 
                          ? "border-[#0C831F] bg-green-50/50" 
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }\`}
                    >
                      <div className="flex items-center justify-between">
                        <svg className={\`h-5 w-5 \${deliveryInstructions.dontRingBell ? "text-[#0C831F]" : "text-slate-500"}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
                        </svg>
                        <div className={\`h-4 w-4 rounded-[3px] border \${deliveryInstructions.dontRingBell ? "border-[#0C831F] bg-[#0C831F]" : "border-slate-300"}\`}>
                          {deliveryInstructions.dontRingBell && (
                            <svg className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={\`text-xs font-semibold leading-tight \${deliveryInstructions.dontRingBell ? "text-[#0C831F]" : "text-slate-700"}\`}>Don't ring<br/>the bell</span>
                    </button>

                    {/* Leave at guard */}
                    <button
                      type="button"
                      onClick={() => setDeliveryInstructions(p => ({ ...p, leaveAtGuard: !p.leaveAtGuard }))}
                      className={\`flex h-24 w-28 shrink-0 snap-start flex-col justify-between rounded-xl border p-3 text-left transition-colors \${
                        deliveryInstructions.leaveAtGuard 
                          ? "border-[#0C831F] bg-green-50/50" 
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }\`}
                    >
                      <div className="flex items-center justify-between">
                        <svg className={\`h-5 w-5 \${deliveryInstructions.leaveAtGuard ? "text-[#0C831F]" : "text-slate-500"}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <div className={\`h-4 w-4 rounded-[3px] border \${deliveryInstructions.leaveAtGuard ? "border-[#0C831F] bg-[#0C831F]" : "border-slate-300"}\`}>
                          {deliveryInstructions.leaveAtGuard && (
                            <svg className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={\`text-xs font-semibold leading-tight \${deliveryInstructions.leaveAtGuard ? "text-[#0C831F]" : "text-slate-700"}\`}>Leave at<br/>guard</span>
                    </button>
                  </div>
                </StepSection>`;

  content = content.substring(0, startIndex) + newSection + content.substring(actualEndIndex);
  fs.writeFileSync(file, content);
  console.log('Successfully updated Delivery instructions section using precise indices.');
} else {
  console.log('Failed to locate section to replace.', startIndex, endIndex);
}
