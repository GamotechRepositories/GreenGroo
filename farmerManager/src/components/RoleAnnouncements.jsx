import { useEffect, useMemo, useState } from "react";

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dayKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDay(value) {
  const day = dayKey(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isActiveOnOrAfterToday(value) {
  const day = dayKey(value);
  if (!day) return true;
  return day >= todayKey();
}

function itemLabel(item) {
  if (item.kind === "holiday") return "Holiday";
  if (item.kind === "shift") return "Shift";
  if (item.kind === "note") return "Note";
  if (item.status === "scheduled") return "Upcoming";
  return "Announcement";
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
          date: row.scheduledAt || row.date || row.publishedAt || row.createdAt || "",
          status: "published",
        })),
        ...extra.map((row) => ({
          id: String(row.id || row._id),
          kind: row.kind || row.category || "announcement",
          title: row.title,
          body: row.body || "",
          date: row.date || row.scheduledAt || "",
          status: row.status || "",
        })),
      ]
        .filter((row) => isActiveOnOrAfterToday(row.date))
        .sort((a, b) => dayKey(a.date).localeCompare(dayKey(b.date)));
      setItems(merged.slice(0, 20));
    });
    return () => {
      cancelled = true;
    };
    // roleKey is the stable refresh key; load fns are created inline by layouts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleKey]);

  const loop = useMemo(() => {
    if (!items.length) return [];
    const copies = items.length === 1 ? 4 : 2;
    return Array.from({ length: copies }, () => items).flat();
  }, [items]);

  if (!items.length) return null;

  const speed = Math.max(18, Math.min(48, items.length * 9));

  return (
    <section className="announcement-strip print:hidden" aria-label="Announcements">
      <div className="announcement-strip-inner">
        <span className="announcement-strip-badge">Live</span>
        <div className="announcement-marquee">
          <div className="announcement-marquee-track" style={{ "--announcement-speed": `${speed}s` }}>
            {loop.map((item, index) => {
              const when = formatDay(item.date);
              const text = [item.title, item.body].filter(Boolean).join(" — ");
              return (
                <span key={`${item.kind}-${item.id}-${index}`} className="announcement-marquee-item">
                  <span className={`announcement-kind announcement-kind-${item.kind || "announcement"}`}>
                    {itemLabel(item)}
                  </span>
                  {when ? <span className="announcement-date">{when}</span> : null}
                  <span className="announcement-text">{text}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
