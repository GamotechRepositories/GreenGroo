import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Pencil, Trash2, Warehouse } from 'lucide-react';
import opsApi from '../../api/opsApi';
import darkStoreApi from '../../api/darkStoreApi';
import { BTN, BTN_PRIMARY, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { DOCUMENT_TYPES, StatusPill, formatDate, openVendorDocument } from './multiVendorShared';

function InfoSection({ title, children }) {
  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <h3 className="mb-1 text-sm font-bold text-slate-900">{title}</h3>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-sm text-slate-500 sm:w-64">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-800">{value === 0 ? 0 : value || '—'}</dd>
    </div>
  );
}

export default function MultiVendorDetailPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allStores, setAllStores] = useState([]);
  const [vendorNames, setVendorNames] = useState({});
  const [assignId, setAssignId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [products, setProducts] = useState([]);
  const [crops, setCrops] = useState([]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await opsApi.get(`vendors/${vendorId}/products`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setProducts([]);
    }
  }, [vendorId]);

  const loadCrops = useCallback(async () => {
    try {
      const res = await opsApi.get(`vendors/${vendorId}/crops`);
      setCrops(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCrops([]);
    }
  }, [vendorId]);

  useEffect(() => {
    loadProducts();
    loadCrops();
  }, [loadProducts, loadCrops]);

  const removeCrop = async (crop) => {
    if (!window.confirm(`Remove "${crop.cropName}" from this collection centre?`)) return;
    try {
      await opsApi.remove(`vendors/${vendorId}/crops`, encodeURIComponent(crop.cropId));
      await loadCrops();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove crop');
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Remove "${product.name}" from this collection centre?`)) return;
    try {
      await opsApi.remove(`vendors/${vendorId}/products`, product.productId);
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove product');
    }
  };

  const loadStores = useCallback(async () => {
    const [storeRes, vendorRes] = await Promise.all([
      darkStoreApi.list().catch(() => ({ stores: [] })),
      opsApi.list('vendors').catch(() => ({ data: [] })),
    ]);
    setAllStores(storeRes.stores || []);
    const names = {};
    (Array.isArray(vendorRes.data) ? vendorRes.data : []).forEach((v) => {
      names[v.id] = v.vendorName || v.ownerName || v.id;
    });
    setVendorNames(names);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    opsApi
      .get(`vendors/${vendorId}`)
      .then((res) => alive && setRow(res.data))
      .catch((err) => alive && setError(err.response?.data?.message || 'Collection centre not found'))
      .finally(() => alive && setLoading(false));
    loadStores();
    return () => {
      alive = false;
    };
  }, [vendorId, loadStores]);

  const vendorNameOf = (id) => vendorNames[id] || 'another centre';
  const assignableStores = allStores.filter((store) => store.vendorId !== vendorId);

  const assignStore = async (storeId, targetVendorId) => {
    setAssigning(true);
    setError('');
    try {
      await darkStoreApi.updateLocation(storeId, { vendorId: targetVendorId });
      const res = await opsApi.get(`vendors/${vendorId}`);
      setRow(res.data);
      setAssignId('');
      await loadStores();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update dark store assignment');
    } finally {
      setAssigning(false);
    }
  };

  const viewDocument = async (doc) => {
    try {
      await openVendorDocument(row.id, doc);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open document');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete collection centre "${row.vendorName || row.ownerName}"?`)) return;
    try {
      await opsApi.remove('vendors', row.id);
      navigate('/multi-vendor');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete collection centre');
    }
  };

  const handleEdit = () =>
    navigate('/multi-vendor', { state: { editId: row.id, returnTo: `/multi-vendor/${row.id}` } });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading collection centre
      </div>
    );
  }

  if (!row) {
    return (
      <div className="space-y-4">
        <Link to="/multi-vendor" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Multi Vendor
        </Link>
        <p className="text-rose-600">{error || 'Collection centre not found'}</p>
      </div>
    );
  }

  const centre = row.collectionCentre;
  const documents = row.documents || [];
  const darkStores = row.darkStores || [];
  const bank = row.bank || {};

  return (
    <div className="space-y-5">
      <Link to="/multi-vendor" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Multi Vendor
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Warehouse className="h-6 w-6" />
          </span>
          <div>
            <h1 className={PAGE_TITLE}>{row.vendorName || row.businessName || row.ownerName}</h1>
            <p className={`mt-0.5 ${PAGE_SUB}`}>{centre?.id || row.vendorCode || row.id}</p>
            <div className="mt-1.5">
              <StatusPill status={row.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDelete} className={`${BTN} gap-1.5 text-xs text-rose-600`}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button type="button" onClick={handleEdit} className={`${BTN_PRIMARY} gap-1.5 text-xs`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className={`${PANEL} divide-y divide-slate-200 px-5 py-5`}>
        <InfoSection title="Vendor details">
          <Info label="Collection centre / Vendor name" value={row.vendorName} />
          <Info label="Business name" value={row.businessName} />
          <Info label="Vendor code" value={row.vendorCode} />
          <Info label="Vendor ID" value={row.id} />
          <Info label="Commission" value={`${row.commissionRate ?? 10}%`} />
          <Info label="Status" value={row.status} />
        </InfoSection>

        <InfoSection title="Owner & contact">
          <Info label="Owner name" value={row.ownerName} />
          <Info label="Mobile (login)" value={row.mobile} />
          <Info label="Email" value={row.email} />
        </InfoSection>

        <InfoSection title="Address">
          <Info label="Address" value={row.businessAddress} />
          <Info label="City" value={row.city} />
          <Info label="State" value={row.state} />
          <Info label="Pincode" value={row.pincode} />
        </InfoSection>

        <InfoSection title="Tax & bank">
          <Info label="GST number" value={row.gstNumber} />
          <Info label="PAN number" value={row.panNumber} />
          <Info label="Account holder" value={bank.accountHolder} />
          <Info label="Bank name" value={bank.bankName} />
          <Info label="Account number" value={bank.accountNumber} />
          <Info label="IFSC" value={bank.ifsc} />
        </InfoSection>

        <InfoSection title="Collection centre">
          {centre ? (
            <>
              <Info label="Centre ID" value={centre.id} />
              <Info label="Centre name" value={centre.name} />
              <Info label="Centre status" value={centre.status} />
              <Info label="Address" value={centre.address} />
              <Info label="City" value={centre.city} />
              <Info label="Contact mobile" value={centre.contactMobile} />
              <Info
                label="Location codes (State / District / Taluka / Village)"
                value={[centre.stateCode, centre.districtCode, centre.talukaCode, centre.villageCode].filter(Boolean).join(' / ')}
              />
            </>
          ) : (
            <Info label="Centre" value="Not created yet — it is created when the vendor is saved." />
          )}
          <Info
            label="Farmers & farmer managers"
            value={
              <span className="flex flex-wrap gap-x-4">
                <Link
                  to={`/collection-farmers?vendorId=${encodeURIComponent(row.id)}`}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  View farmers
                </Link>
                <Link
                  to={`/collection-farmer-managers?vendorId=${encodeURIComponent(row.id)}`}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  View farmer managers
                </Link>
              </span>
            }
          />
        </InfoSection>

        <InfoSection title={`Dark stores (${darkStores.length})`}>
          <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center">
            <select
              value={assignId}
              onChange={(e) => setAssignId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm sm:w-80"
            >
              <option value="">Select a dark store to assign</option>
              {assignableStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.storeName}
                  {store.city ? ` · ${store.city}` : ''}
                  {store.vendorId ? ` (moves from ${vendorNameOf(store.vendorId)})` : ' (not assigned)'}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!assignId || assigning}
              onClick={() => assignStore(assignId, row.id)}
              className={`${BTN_PRIMARY} disabled:opacity-50`}
            >
              Assign
            </button>
            <Link
              to="/dark-stores"
              state={{ createFor: row.id }}
              className="text-sm font-semibold text-emerald-700 hover:underline sm:ml-2"
            >
              + Create new dark store
            </Link>
          </div>
          {darkStores.length === 0 ? (
            <Info label="Linked dark stores" value={<span className="font-normal text-slate-400">None yet</span>} />
          ) : (
            darkStores.map((store) => (
              <Info
                key={store.id}
                label={store.storeName}
                value={
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span>{[store.area, store.city, store.state].filter(Boolean).join(', ') || '—'}</span>
                    {store.managerName ? (
                      <span className="text-xs font-normal text-slate-500">
                        Manager: {store.managerName}
                        {store.phone ? ` · ${store.phone}` : ''}
                      </span>
                    ) : null}
                    <span className={`text-xs font-semibold ${store.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {store.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      disabled={assigning}
                      onClick={() => {
                        if (window.confirm(`Remove "${store.storeName}" from this collection centre?`)) {
                          assignStore(store.id, '');
                        }
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </span>
                }
              />
            ))
          )}
        </InfoSection>

        <InfoSection title={`Products (${products.length})`}>
          {products.length === 0 ? (
            <Info
              label="Approved catalog products"
              value={
                <span className="font-normal text-slate-400">
                  None yet — the centre requests products from its panel; approve them in{' '}
                  <Link to="/vendor-product-requests" className="font-semibold text-emerald-700 hover:underline">
                    Product Requests
                  </Link>
                </span>
              }
            />
          ) : (
            products.map((product) => (
              <Info
                key={product.productId}
                label={product.name}
                value={
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span>{[product.category, product.unit].filter(Boolean).join(' · ') || '—'}</span>
                    {product.catalogMissing ? (
                      <span className="text-xs font-semibold text-rose-600">Not active in catalog</span>
                    ) : null}
                    <span className="text-xs font-normal text-slate-400">Added {formatDate(product.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => removeProduct(product)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </span>
                }
              />
            ))
          )}
        </InfoSection>

        <InfoSection title={`Crops (${crops.length})`}>
          {crops.length === 0 ? (
            <Info
              label="Approved crops"
              value={
                <span className="font-normal text-slate-400">
                  None yet — the centre requests crops from its panel; approve them in{' '}
                  <Link to="/vendor-crop-requests" className="font-semibold text-emerald-700 hover:underline">
                    Crop Requests
                  </Link>
                </span>
              }
            />
          ) : (
            crops.map((crop) => (
              <Info
                key={crop.cropId}
                label={`${crop.cropName}${crop.variety ? ` (${crop.variety})` : ''}`}
                value={
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span>{[crop.category, crop.cropId].filter(Boolean).join(' · ')}</span>
                    {crop.catalogMissing ? (
                      <span className="text-xs font-semibold text-rose-600">Not in admin crop list</span>
                    ) : null}
                    <span className="text-xs font-normal text-slate-400">Added {formatDate(crop.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => removeCrop(crop)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </span>
                }
              />
            ))
          )}
        </InfoSection>

        <InfoSection title="Record">
          <Info label="Created" value={formatDate(row.createdAt)} />
          <Info label="Last updated" value={formatDate(row.updatedAt)} />
        </InfoSection>

        <InfoSection title={`Documents (${documents.length}/${DOCUMENT_TYPES.length})`}>
          {DOCUMENT_TYPES.map(({ type, label }) => {
            const doc = documents.find((d) => d.type === type);
            return (
              <Info
                key={type}
                label={label}
                value={
                  doc ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{doc.fileName}</span>
                      <span className="text-xs font-normal text-slate-400">Uploaded {formatDate(doc.uploadedAt)}</span>
                      <button
                        type="button"
                        onClick={() => viewDocument(doc)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> View
                      </button>
                    </span>
                  ) : (
                    <span className="font-normal text-slate-400">Not uploaded</span>
                  )
                }
              />
            );
          })}
        </InfoSection>
      </div>
    </div>
  );
}
