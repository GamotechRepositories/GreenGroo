import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageShell } from '../../components/layout/SegregationManagerLayout';
import { Icon } from '../../components/ui/Icon';

const STEPS = [
  'Request',
  'Batches Received',
  'Segregation',
  'Packing',
  'QR Generation',
  'Verification',
  'Completed',
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(2); // Mocking 'Segregation' step

  const [activeBatch, setActiveBatch] = useState(null);
  const [gradeAllocation, setGradeAllocation] = useState({
    A: '',
    B: '',
    C: '',
  });

  const [packingStarted, setPackingStarted] = useState(false);
  const [packsCreated, setPacksCreated] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [packVerified, setPackVerified] = useState(false);

  // Mock Order Data
  const order = {
    id: id || 'ORD-20261001-00125',
    darkStore: 'Wakad Dark Store',
    zone: 'Pune West',
    requestedBy: 'Delivery Manager',
    createdAt: '01 Oct 2026, 10:24 AM',
    status: 'In Process',
    product: 'Tomato',
    requestedQty: 100,
    grades: {
      A: 60,
      B: 30,
      C: 10,
    },
    packedQty: 40,
  };

  const batches = [
    {
      id: 'BATCH-20261001-00021',
      farmer: 'Ramesh Patil',
      product: 'Tomato',
      received: 50,
      remaining: 50,
      status: 'Received',
    },
    {
      id: 'BATCH-20261001-00022',
      farmer: 'Suresh Jadhav',
      product: 'Tomato',
      received: 30,
      remaining: 30,
      status: 'Received',
    },
  ];

  const handleAllocate = (e) => {
    e.preventDefault();
    const total = Number(gradeAllocation.A) + Number(gradeAllocation.B) + Number(gradeAllocation.C);
    if (total > activeBatch.remaining) {
      alert("Quantity exceeds available batch quantity.");
      return;
    }
    // Proceed to packing
    setCurrentStep(3); // Packing step
  };

  const handleCreatePacks = () => {
    setPacksCreated(true);
    setCurrentStep(4);
  }

  const handleGenerateQR = () => {
    setQrGenerated(true);
    setCurrentStep(5);
  }

  return (
    <PageShell
      title={`Order Details: ${order.id}`}
      subtitle="Track segregation, packing, and QR generation"
    >
      <div className="mb-6">
        <Link to="/orders/dark-store" className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
          <Icon name="arrowLeft" className="h-4 w-4" /> Back to Orders
        </Link>
      </div>

      {/* Stepper */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${
                idx < currentStep ? 'bg-green-600 text-white' :
                idx === currentStep ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-slate-100 text-slate-400'
              }`}>
                {idx + 1}
              </div>
              <span className={`ml-3 text-sm font-medium ${idx === currentStep ? 'text-slate-900' : 'text-slate-500'}`}>
                {step}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-12 mx-4 ${idx < currentStep ? 'bg-green-600' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Section 1: Order Information */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Order Information</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Order ID</dt>
                <dd className="font-bold text-slate-900">{order.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Dark Store</dt>
                <dd className="font-medium text-slate-900">{order.darkStore}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Zone</dt>
                <dd className="font-medium text-slate-900">{order.zone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-slate-900">{order.createdAt}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Current Status</dt>
                <dd className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                  {order.status}
                </dd>
              </div>
            </dl>
          </div>

          {/* Section 2: Product Requirements */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Product Requirements</h3>
            <div className="mb-4">
              <h4 className="text-lg font-black text-slate-900 uppercase">{order.product}</h4>
              <p className="text-slate-500 text-sm">Requested: <span className="font-bold text-slate-900">{order.requestedQty} KG</span></p>
            </div>
            
            <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <div className="flex justify-between"><span className="text-slate-500">Grade A</span><span className="font-bold">{order.grades.A} KG</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Grade B</span><span className="font-bold">{order.grades.B} KG</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Grade C</span><span className="font-bold">{order.grades.C} KG</span></div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-900">{order.packedQty} KG / {order.requestedQty} KG packed</span>
                <span className="text-slate-500">{order.requestedQty - order.packedQty} KG remaining</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(order.packedQty / order.requestedQty) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!packingStarted ? (
            <>
              {/* Section 3: Source Batches */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Source Batches</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {batches.map(batch => (
                    <div key={batch.id} className={`rounded-xl border-2 p-4 transition-all ${activeBatch?.id === batch.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="font-bold text-slate-900">{batch.id}</div>
                      <div className="text-sm text-slate-500 mt-1">Farmer: <span className="font-medium text-slate-900">{batch.farmer}</span></div>
                      <div className="text-sm text-slate-500">Product: <span className="font-medium text-slate-900">{batch.product}</span></div>
                      <div className="mt-3 flex justify-between text-sm">
                        <span className="bg-green-100 text-green-800 px-2 rounded font-medium">{batch.status}</span>
                        <span className="font-bold text-slate-900">{batch.remaining} KG remaining</span>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => setActiveBatch(batch)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeBatch?.id === batch.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {activeBatch?.id === batch.id ? 'Active Source' : 'Scan & Use Batch'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Segregation */}
              {activeBatch && (
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-blue-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">BATCH LOCK</div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Segregation / Grade Allocation</h3>
                  
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-500">Active Source Batch</p>
                    <p className="font-black text-lg text-slate-900">{activeBatch.id}</p>
                    <p className="text-sm text-slate-700 mt-1">Farmer: <span className="font-bold">{activeBatch.farmer}</span> | Available: <span className="font-bold">{activeBatch.remaining} KG</span></p>
                    <div className="mt-3">
                      <button onClick={() => setActiveBatch(null)} className="text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded">Switch Source Batch</button>
                    </div>
                  </div>

                  <form onSubmit={handleAllocate}>
                    <div className="space-y-4 max-w-sm">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Grade A (KG)</label>
                        <input type="number" min="0" value={gradeAllocation.A} onChange={e => setGradeAllocation({...gradeAllocation, A: e.target.value})} className="w-24 rounded-lg border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-right" placeholder="0" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Grade B (KG)</label>
                        <input type="number" min="0" value={gradeAllocation.B} onChange={e => setGradeAllocation({...gradeAllocation, B: e.target.value})} className="w-24 rounded-lg border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-right" placeholder="0" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Grade C (KG)</label>
                        <input type="number" min="0" value={gradeAllocation.C} onChange={e => setGradeAllocation({...gradeAllocation, C: e.target.value})} className="w-24 rounded-lg border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-right" placeholder="0" />
                      </div>
                      
                      <div className="pt-4 border-t flex justify-between items-center">
                        <span className="font-bold text-slate-900">Total Allocated</span>
                        <span className="font-black text-lg text-slate-900">
                          {Number(gradeAllocation.A) + Number(gradeAllocation.B) + Number(gradeAllocation.C)} KG
                        </span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <button 
                        type="button"
                        onClick={() => setPackingStarted(true)}
                        className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all w-full md:w-auto"
                      >
                        Confirm Allocation & Start Packing
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* Section 5: Packing Session */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-slate-900">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Packing Session</h3>
                    <p className="font-black text-xl text-slate-900 mt-1">PS-20261001-00018</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Source Batch Locked</p>
                    <p className="font-bold text-sm text-slate-900">{activeBatch.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">Grade</p>
                    <p className="font-bold text-slate-900 text-lg">A</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">Target Qty</p>
                    <p className="font-bold text-slate-900 text-lg">{gradeAllocation.A || 30} KG</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">Pack Size</p>
                    <p className="font-bold text-slate-900 text-lg">500 g</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <p className="text-xs text-green-600 font-bold">Expected Packs</p>
                    <p className="font-black text-green-700 text-xl">{((gradeAllocation.A || 30) * 2)}</p>
                  </div>
                </div>

                {!packsCreated ? (
                  <button 
                    onClick={handleCreatePacks}
                    className="w-full rounded-xl bg-blue-600 px-6 py-4 text-center text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-all"
                  >
                    Generate Virtual Packs in System
                  </button>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center">✓</div>
                        <div>
                          <p className="font-bold">60 Packs Successfully Created</p>
                          <p className="text-xs opacity-80">PACK-000001 through PACK-000060</p>
                        </div>
                      </div>
                    </div>

                    {!qrGenerated ? (
                      <button 
                        onClick={handleGenerateQR}
                        className="w-full rounded-xl bg-slate-900 px-6 py-4 text-center text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all"
                      >
                        Generate QR Labels for 60 Packs
                      </button>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 text-center">
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">QR LABELS READY</p>
                          <p className="text-3xl font-black text-slate-900 mb-6">60 Labels</p>
                          <div className="flex justify-center gap-4">
                            <button className="rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-green-700 flex items-center gap-2">
                              <Icon name="printer" className="h-4 w-4" /> Print All
                            </button>
                            <button className="rounded-lg bg-white border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                              Print Selected
                            </button>
                          </div>
                        </div>

                        {/* Section 9: QR Verification */}
                        <div className="border-t-2 border-dashed border-slate-200 pt-8">
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Step 9: Verify Pasted Labels</h3>
                          
                          {!packVerified ? (
                            <button 
                              onClick={() => { setPackVerified(true); setCurrentStep(6); }}
                              className="w-full rounded-xl border-2 border-blue-200 bg-blue-50 px-6 py-8 text-center hover:bg-blue-100 transition-colors group cursor-pointer"
                            >
                              <Icon name="scanLine" className="h-10 w-10 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                              <p className="font-bold text-blue-900">Click to Simulate Scan QR</p>
                            </button>
                          ) : (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                              <div className="flex items-center gap-2 text-emerald-700 font-black mb-4">
                                <Icon name="checkCircle" className="h-6 w-6" /> PACK VERIFIED SUCCESSFULLY
                              </div>
                              <dl className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-lg shadow-sm">
                                <div><dt className="text-slate-500">Pack ID</dt><dd className="font-bold">PACK-000001</dd></div>
                                <div><dt className="text-slate-500">Grade</dt><dd className="font-bold">A (500 g)</dd></div>
                                <div><dt className="text-slate-500">Batch</dt><dd className="font-medium text-slate-700">BATCH-20261001-00021</dd></div>
                                <div><dt className="text-slate-500">Farmer</dt><dd className="font-medium text-slate-700">Ramesh Patil</dd></div>
                              </dl>
                              <div className="mt-4 text-center">
                                <button className="text-sm font-bold text-emerald-700 hover:text-emerald-800 underline decoration-2 underline-offset-4">Scan Next QR</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
