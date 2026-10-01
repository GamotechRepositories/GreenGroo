import React, { useState, useEffect } from 'react';
import { PageShell } from '../../components/layout/SegregationManagerLayout';
import { Icon } from '../../components/ui/Icon';
import { staffApi } from '../../api/staffApi';

const MOCK_PACKS = [
  { id: 'PACK-000001', product: 'Tomato', grade: 'A', farmer: 'Ramesh Patil', batch: 'BATCH-20261001-00021', order: 'ORD-00125', qty: '500 g', status: 'Verified', date: '01 Oct 2026' },
  { id: 'PACK-000002', product: 'Tomato', grade: 'A', farmer: 'Ramesh Patil', batch: 'BATCH-20261001-00021', order: 'ORD-00125', qty: '500 g', status: 'Generated', date: '01 Oct 2026' },
  { id: 'PACK-000003', product: 'Potato', grade: 'B', farmer: 'Suresh Jadhav', batch: 'BATCH-20261001-00022', order: 'ORD-00126', qty: '1 kg', status: 'Printed', date: '01 Oct 2026' },
];

export default function QrStorePage() {
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' or 'batches'
  const [search, setSearch] = useState('');
  const [viewingPack, setViewingPack] = useState(null);
  
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    setLoadingBatches(true);
    staffApi.vendorBatches()
      .then(data => {
        setBatches(data || []);
        setLoadingBatches(false);
      })
      .catch(err => {
        console.error("Failed to load vendor batches", err);
        setLoadingBatches(false);
      });
  }, []);

  const filteredPacks = MOCK_PACKS.filter(p => 
    p.id.toLowerCase().includes(search.toLowerCase()) || 
    p.order.toLowerCase().includes(search.toLowerCase()) ||
    p.farmer.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBatches = batches.filter(b => 
    (b.id && b.id.toLowerCase().includes(search.toLowerCase())) || 
    (b.farmer && b.farmer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageShell
      title="QR Store"
      subtitle="Manage, verify and track all QR-labelled packed items."
    >
      {viewingPack ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <button onClick={() => setViewingPack(null)} className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2">
              <Icon name="arrowLeft" className="h-4 w-4" /> Back to QR Store
            </button>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">✓ Verified</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Pack Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="block text-slate-500">Pack ID</span><span className="font-bold text-lg text-slate-900">{viewingPack.id}</span></div>
                  <div><span className="block text-slate-500">Product</span><span className="font-medium text-slate-900">{viewingPack.product}</span></div>
                  <div><span className="block text-slate-500">Grade</span><span className="font-medium text-slate-900">{viewingPack.grade}</span></div>
                  <div><span className="block text-slate-500">Quantity</span><span className="font-medium text-slate-900">{viewingPack.qty}</span></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Source Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="block text-slate-500">Farmer</span><span className="font-medium text-slate-900">{viewingPack.farmer}</span></div>
                  <div><span className="block text-slate-500">Batch</span><span className="font-medium text-slate-900">{viewingPack.batch}</span></div>
                  <div><span className="block text-slate-500">Harvest Date</span><span className="font-medium text-slate-900">01 Oct 2026</span></div>
                  <div><span className="block text-slate-500">Harvest Time</span><span className="font-medium text-slate-900">06:10 AM</span></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="block text-slate-500">Order</span><span className="font-medium text-slate-900">{viewingPack.order}</span></div>
                  <div><span className="block text-slate-500">Dark Store</span><span className="font-medium text-slate-900">Wakad Dark Store</span></div>
                  <div><span className="block text-slate-500">Zone</span><span className="font-medium text-slate-900">Pune West</span></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Traceability Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-4"><div className="w-24 text-xs text-slate-500 text-right">01 Oct 06:10 AM</div><div className="border-l-2 border-slate-200 pl-4"><p className="text-sm font-bold">Harvested</p><p className="text-xs text-slate-500">Farmer: {viewingPack.farmer}</p></div></div>
                  <div className="flex gap-4"><div className="w-24 text-xs text-slate-500 text-right">01 Oct 11:42 AM</div><div className="border-l-2 border-slate-200 pl-4"><p className="text-sm font-bold">Batch Received</p><p className="text-xs text-slate-500">Dark Store: Wakad</p></div></div>
                  <div className="flex gap-4"><div className="w-24 text-xs text-slate-500 text-right">01 Oct 01:55 PM</div><div className="border-l-2 border-slate-200 pl-4"><p className="text-sm font-bold">Segregation Started</p></div></div>
                  <div className="flex gap-4"><div className="w-24 text-xs text-slate-500 text-right">01 Oct 02:32 PM</div><div className="border-l-2 border-slate-200 pl-4"><p className="text-sm font-bold">Pack Created</p></div></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              <div className="bg-slate-900 p-8 rounded-2xl shadow-lg text-center text-white">
                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                  <Icon name="qrCode" className="h-32 w-32 text-slate-900" />
                </div>
                <p className="font-mono text-sm tracking-widest">{viewingPack.id}</p>
                <div className="mt-6 flex flex-col gap-2">
                  <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100">Print Again</button>
                  <button className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 hover:bg-slate-700">Download Label</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-max">
            <button
              onClick={() => setActiveTab('packs')}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${activeTab === 'packs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Physical Packs
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${activeTab === 'batches' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Source Batches (From Vendor)
            </button>
          </div>

          {activeTab === 'packs' ? (
            <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"><p className="text-xs text-slate-500 font-bold uppercase">Total QR Packs</p><p className="text-2xl font-black text-slate-900">4,521</p></div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"><p className="text-xs text-slate-500 font-bold uppercase">Generated</p><p className="text-2xl font-black text-blue-600">120</p></div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"><p className="text-xs text-slate-500 font-bold uppercase">Printed</p><p className="text-2xl font-black text-purple-600">85</p></div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"><p className="text-xs text-slate-500 font-bold uppercase">Verified</p><p className="text-2xl font-black text-emerald-600">4,200</p></div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex gap-4 mb-6">
              <input 
                type="text" 
                placeholder="Search by Pack ID / QR Token / Order ID / Batch ID / Farmer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
              />
              <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200">Filters</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 text-slate-500 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold">Pack ID</th>
                    <th className="px-4 py-3 font-bold">Product</th>
                    <th className="px-4 py-3 font-bold">Grade</th>
                    <th className="px-4 py-3 font-bold">Farmer</th>
                    <th className="px-4 py-3 font-bold">Batch</th>
                    <th className="px-4 py-3 font-bold">Order</th>
                    <th className="px-4 py-3 font-bold">Quantity</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPacks.map(pack => (
                    <tr key={pack.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-900 font-medium">{pack.id}</td>
                      <td className="px-4 py-3">{pack.product}</td>
                      <td className="px-4 py-3 font-bold">{pack.grade}</td>
                      <td className="px-4 py-3">{pack.farmer}</td>
                      <td className="px-4 py-3 text-xs">{pack.batch}</td>
                      <td className="px-4 py-3 text-xs">{pack.order}</td>
                      <td className="px-4 py-3 font-medium">{pack.qty}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          pack.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>{pack.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewingPack(pack)} className="text-blue-600 hover:text-blue-800 font-bold text-xs">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex gap-4 mb-6">
              <input 
                type="text" 
                placeholder="Search by Batch ID / Farmer Name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 text-slate-500 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold">Batch ID</th>
                    <th className="px-4 py-3 font-bold">Product</th>
                    <th className="px-4 py-3 font-bold">Farmer</th>
                    <th className="px-4 py-3 font-bold">Received Qty</th>
                    <th className="px-4 py-3 font-bold">Vendor Status</th>
                    <th className="px-4 py-3 font-bold">Arrival Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingBatches ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500">Loading batches...</td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500">No batches found from vendor.</td>
                    </tr>
                  ) : (
                    filteredBatches.map(batch => (
                      <tr key={batch.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-slate-900 font-medium">{batch.id}</td>
                        <td className="px-4 py-3">{batch.product}</td>
                        <td className="px-4 py-3 font-bold">{batch.farmer}</td>
                        <td className="px-4 py-3 font-medium">{batch.receivedQty}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold capitalize">{batch.vendorStatus}</span>
                        </td>
                        <td className="px-4 py-3">{batch.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
