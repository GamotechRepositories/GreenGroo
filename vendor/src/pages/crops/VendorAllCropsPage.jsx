import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const INPUT = "w-full border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#217346]";

export default function VendorAllCropsPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [crops, setCrops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    vendorApi
      .getCatalogCrops({ q, category })
      .then((res) => {
        if (!alive) return;
        setCrops(res.data?.crops || []);
        setCategories(res.data?.categories || []);
        setError("");
      })
      .catch((err) => alive && setError(err?.response?.data?.message || "Failed to load crops"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, category]);

  const sendRequest = async () => {
    if (!selected || sending) return;
    setSending(true);
    setError("");
    try {
      await vendorApi.createCropRequest({ cropId: selected.cropId, notes });
      setCrops((prev) => prev.map((c) => (c.cropId === selected.cropId ? { ...c, requested: true } : c)));
      setToast(`Request for "${selected.cropName}${selected.variety ? ` (${selected.variety})` : ""}" sent to admin. It will appear in My Crops once approved.`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send request");
    } finally {
      setSelected(null);
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Crops</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Every crop in the admin crop list. Send a request to add one — it moves to My Crops after admin approves it.
          </p>
        </div>
        <Link to="/vendor/my-crops" className="border border-[#217346] px-4 py-2 text-xs font-semibold text-[#217346] hover:bg-[#E8F5E9]">
          My Crops
        </Link>
      </div>

      {toast ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{toast}</div> : null}
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search crop, variety, crop ID…"
          className={`${INPUT} sm:max-w-sm`}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${INPUT} sm:max-w-[220px]`}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading crops…</p>
      ) : crops.length === 0 ? (
        <p className="border border-gray-200 bg-white px-4 py-8 text-center text-xs text-gray-400">No crops found</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2">Crop</th>
                <th className="px-4 py-2">Variety</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Crop ID</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {crops.map((c) => (
                <tr key={c.cropId} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-2 font-semibold text-gray-900">{c.cropName}</td>
                  <td className="px-4 py-2 text-gray-600">{c.variety || "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{c.category || "—"}</td>
                  <td className="px-4 py-2 font-mono text-[10px] text-emerald-700">{c.cropId}</td>
                  <td className="px-4 py-2 text-right">
                    {c.added ? (
                      <span className="inline-block border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        In My Crops
                      </span>
                    ) : c.requested ? (
                      <span className="inline-block border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                        Waiting for approval
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNotes("");
                          setSelected(c);
                        }}
                        className="bg-[#217346] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1a5c38]"
                      >
                        Request to add
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white p-5 shadow-xl">
            <h2 className="text-sm font-bold text-gray-900">Request to add crop</h2>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {selected.cropName}
              {selected.variety ? <span className="font-normal text-gray-500"> · {selected.variety}</span> : null}
            </p>
            <p className="text-[11px] text-gray-500">{[selected.category, selected.cropId].filter(Boolean).join(" · ")}</p>
            <label className="mt-4 block text-[11px] font-semibold text-gray-600">Note for admin (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className={`${INPUT} mt-1`}
              placeholder="e.g. Farmers near our centre grow this crop"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="border border-gray-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={sendRequest}
                className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send for Approval"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
