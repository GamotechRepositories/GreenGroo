import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { createManagerCropRequest, getManagerVendorCrops } from "../../api/farmerApi";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from "../../utils/excelStyles";

function ManagerAllCropsPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [crops, setCrops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
    getManagerVendorCrops({ q, category })
      .then((res) => {
        if (!alive) return;
        setCrops(res?.crops || []);
        setCategories(res?.categories || []);
      })
      .catch((err) => {
        if (alive) toast.error(err.message || "Failed to load crops");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, category]);

  const sendRequest = async () => {
    if (!selected || sending) return;
    setSending(true);
    try {
      await createManagerCropRequest({ cropId: selected.cropId, notes });
      setCrops((prev) => prev.map((c) => (c.cropId === selected.cropId ? { ...c, requested: true } : c)));
      toast.success(
        `Request for "${selected.cropName}${selected.variety ? ` (${selected.variety})` : ""}" sent. It will appear in My Crops once the collection centre accepts it.`
      );
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setSelected(null);
      setNotes("");
      setSending(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>All Crops</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            Crops approved for your collection centre. Send a request to add one — it moves to My Crops after they accept it.
          </p>
        </div>
        <Link to="/manager/my-crops" className={`${EXCEL_BTN} h-9 shrink-0 px-3 text-sm sm:h-10 sm:px-4`}>
          My Crops
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search crop, variety, crop ID…"
          className={`${EXCEL_INPUT} sm:max-w-sm`}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${EXCEL_INPUT} sm:max-w-[220px]`}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : crops.length === 0 ? (
        <EmptyState
          title="No crops from your collection centre"
          description="When the collection centre has crops in My Crops, they will appear here for you to request."
        />
      ) : (
        <div className={EXCEL_WRAP}>
          <table className={EXCEL_TABLE}>
            <thead>
              <tr>
                <th className={EXCEL_HEAD}>Crop</th>
                <th className={`${EXCEL_HEAD} hidden sm:table-cell`}>Variety</th>
                <th className={`${EXCEL_HEAD} hidden md:table-cell`}>Category</th>
                <th className={`${EXCEL_HEAD} hidden lg:table-cell`}>Crop ID</th>
                <th className={`${EXCEL_HEAD} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {crops.map((crop) => (
                <tr key={crop.cropId} className="hover:bg-slate-50/60">
                  <td className={EXCEL_CELL}>
                    <p className="font-semibold text-slate-900">{crop.cropName}</p>
                    <p className="text-[11px] text-slate-500 sm:hidden">{crop.variety || "—"}</p>
                  </td>
                  <td className={`${EXCEL_CELL} hidden sm:table-cell`}>{crop.variety || "—"}</td>
                  <td className={`${EXCEL_CELL} hidden md:table-cell`}>{crop.category || "—"}</td>
                  <td className={`${EXCEL_CELL} hidden font-mono text-[11px] text-emerald-700 lg:table-cell`}>
                    {crop.cropId}
                  </td>
                  <td className={`${EXCEL_CELL} text-right`}>
                    {crop.added ? (
                      <span className="inline-block rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        In My Crops
                      </span>
                    ) : crop.requested ? (
                      <span className="inline-block rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                        Waiting for approval
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNotes("");
                          setSelected(crop);
                        }}
                        className={`${EXCEL_BTN_PRIMARY} h-8 px-3 text-[11px]`}
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
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900">Request to add crop</h2>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {selected.cropName}
              {selected.variety ? <span className="font-normal text-slate-500"> · {selected.variety}</span> : null}
            </p>
            <p className="text-[11px] text-slate-500">{[selected.category, selected.cropId].filter(Boolean).join(" · ")}</p>
            <label className="mt-4 block text-[11px] font-semibold text-slate-600">Note for collection centre (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className={`${EXCEL_INPUT} mt-1`}
              placeholder="e.g. Our farmers grow this crop"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className={EXCEL_BTN}>
                Cancel
              </button>
              <button type="button" disabled={sending} onClick={sendRequest} className={EXCEL_BTN_PRIMARY}>
                {sending ? "Sending…" : "Send for Approval"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ManagerAllCropsPage;
