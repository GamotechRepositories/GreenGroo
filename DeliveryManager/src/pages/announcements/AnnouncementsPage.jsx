import { useCallback, useEffect, useMemo, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";

const KIND_META = {
  announcement: { label: "Announcement", badge: "bg-violet-50 text-violet-700 ring-violet-200", bar: "bg-violet-500" },
  upcoming: { label: "Upcoming", badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-500" },
  holiday: { label: "Holiday", badge: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500" },
  shift: { label: "Shift", badge: "bg-sky-50 text-sky-700 ring-sky-200", bar: "bg-sky-500" },
  note: { label: "Note", badge: "bg-orange-50 text-orange-700 ring-orange-200", bar: "bg-orange-500" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "announcement", label: "Announcements" },
  { id: "upcoming", label: "Upcoming" },
  { id: "holiday", label: "Holidays" },
  { id: "shift", label: "Shifts" },
  { id: "note", label: "Notes" },
];

function formatDay(value) {
  const day = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mergeFeed(announcements, calendar) {
  const announced = Array.isArray(announcements) ? announcements : [];
  const cal = Array.isArray(calendar) ? calendar : [];
  const seen = new Set(announced.map((row) => String(row._id || row.id || "")));
  const extra = cal.filter((row) => {
    const id = String(row.id || row._id || "");
    if (!id || seen.has(id)) return false;
    return !(row.status === "published" && ["announcement", "holiday", "note"].includes(row.kind || row.category));
  });
  const toItem = (row, date, status) => {
    const rawKind = row.kind || row.category || "announcement";
    const kind = rawKind === "announcement" && status === "scheduled" ? "upcoming" : rawKind;
    return {
      id: String(row._id || row.id),
      kind: KIND_META[kind] ? kind : "announcement",
      title: row.title,
      body: row.body || "",
      date,
    };
  };
  return [
    ...announced.map((row) => toItem(row, row.scheduledAt || row.publishedAt || row.createdAt || "", "published")),
    ...extra.map((row) => toItem(row, row.date || "", row.status || "")),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [announcements, calendar] = await Promise.all([
        managerApi.liveAnnouncements().catch(() => []),
        managerApi.liveCalendar().catch(() => []),
      ]);
      setItems(mergeFeed(announcements, calendar));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: items.length };
    items.forEach((i) => {
      c[i.kind] = (c[i.kind] || 0) + 1;
    });
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "all" || i.kind === filter) &&
        (!q || `${i.title} ${i.body}`.toLowerCase().includes(q))
    );
  }, [items, filter, search]);

  return (
    <PageShell
      title="Announcements"
    >
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === f.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
              <span className={`ml-1.5 tabular-nums ${filter === f.id ? "text-slate-300" : "text-slate-400"}`}>
                {counts[f.id] || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none md:w-64"
          />
          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading announcements…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {items.length === 0 ? "No announcements published for your role yet." : "Nothing matches this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visible.map((item) => {
            const meta = KIND_META[item.kind];
            const when = formatDay(item.date);
            return (
              <article
                key={`${item.kind}-${item.id}`}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pl-5 shadow-sm"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`} />
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${meta.badge}`}>
                    {meta.label}
                  </span>
                  {when ? <span className="text-[11px] tabular-nums text-slate-500">{when}</span> : null}
                </div>
                <h3 className="mt-2 break-words text-sm font-bold text-slate-900">{item.title}</h3>
                {item.body ? (
                  <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
