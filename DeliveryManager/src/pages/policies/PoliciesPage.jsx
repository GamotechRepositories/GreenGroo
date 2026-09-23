import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";

export default function PoliciesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await managerApi.livePolicies();
      setRows(Array.isArray(list) ? list : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load policies");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageShell
      title="Policies"
      subtitle="Policies published by admin for delivery managers."
    >
      {error ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading policies…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No policies published for your role yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const id = row.id || row._id;
            const open = openId === id;
            return (
              <div key={id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? "" : id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div>
                    <p className="font-bold text-slate-900">{row.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Updated{" "}
                      {row.updatedAt
                        ? new Date(row.updatedAt).toLocaleDateString("en-IN")
                        : "—"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{open ? "▲" : "▼"}</span>
                </button>
                {open ? (
                  <div className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {row.body || "—"}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
