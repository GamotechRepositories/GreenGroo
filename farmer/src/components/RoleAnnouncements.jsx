import { useEffect, useState } from "react";

function formatDay(value) {
  const day = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RoleAnnouncements({ roleKey, load, loadCalendar }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      Promise.resolve(load()).catch(() => []),
      loadCalendar ? Promise.resolve(loadCalendar()).catch(() => []) : Promise.resolve([]),
    ]).then(([announcements, calendar]) => {
      if (cancelled) return;
      const announced = Array.isArray(announcements) ? announcements : [];
      const cal = Array.isArray(calendar) ? calendar : [];
      const seen = new Set(announced.map((row) => String(row._id || row.id || "")));
      const extra = cal.filter((row) => {
        const id = String(row.id || row._id || "");
        if (!id || seen.has(id)) return false;
        if (
          row.status === "published" &&
          ["announcement", "holiday", "note"].includes(row.kind || row.category)
        ) {
          return false;
        }
        return true;
      });
      const merged = [
        ...announced.map((row) => ({
          id: String(row._id || row.id),
          kind: row.kind || row.category || "announcement",
          title: row.title,
          body: row.body || "",
          date: row.scheduledAt || row.publishedAt || row.createdAt || "",
          status: "published",
        })),
        ...extra.map((row) => ({
          id: String(row.id || row._id),
          kind: row.kind || row.category || "announcement",
          title: row.title,
          body: row.body || "",
          date: row.date || "",
          status: row.status || "",
        })),
      ];
      setItems(merged.slice(0, 8));
    });
    return () => {
      cancelled = true;
    };
    // roleKey is the stable refresh key; load fns are created inline by layouts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleKey]);

  if (!items.length) return null;

  return (
    <section className="mb-3 space-y-2 sm:mb-4">
      {items.map((item) => {
        const isShift = item.kind === "shift";
        const isHoliday = item.kind === "holiday";
        const isNote = item.kind === "note";
        const isUpcoming = item.status === "scheduled";
        const tone = isHoliday
          ? "border-rose-200 bg-rose-50"
          : isShift
            ? "border-sky-200 bg-sky-50"
            : isNote
              ? "border-orange-200 bg-orange-50"
              : isUpcoming
                ? "border-amber-200 bg-amber-50"
                : "border-violet-200 bg-violet-50";
        const labelTone = isHoliday
          ? "text-rose-700"
          : isShift
            ? "text-sky-700"
            : isNote
              ? "text-orange-700"
              : isUpcoming
                ? "text-amber-700"
                : "text-violet-700";
        const label = isHoliday
          ? "Holiday"
          : isShift
            ? "Shift"
            : isNote
              ? "Note"
              : isUpcoming
                ? "Upcoming"
                : "Announcement";
        const when = formatDay(item.date);
        return (
          <article
            key={`${item.kind}-${item.id}`}
            className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${tone}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={`text-[10px] font-bold uppercase tracking-wide sm:text-[11px] ${labelTone}`}>
                {label}
              </p>
              {when ? (
                <p className="text-[10px] tabular-nums text-slate-500 sm:text-[11px]">{when}</p>
              ) : null}
            </div>
            <p className="mt-0.5 break-words text-[13px] font-semibold text-slate-900 sm:text-sm">
              {item.title}
            </p>
            {item.body ? (
              <p className="mt-1 whitespace-pre-wrap break-words text-[12px] text-slate-600 sm:text-sm">
                {item.body}
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
