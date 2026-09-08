import { useEffect, useState } from "react";

export default function RoleAnnouncements({ roleKey, load }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(load())
      .then((rows) => {
        if (!cancelled) setItems(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [roleKey]);

  if (!items.length) return null;

  return (
    <section className="space-y-2">
      {items.slice(0, 5).map((item) => (
        <article
          key={item._id}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
            Announcement
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.title}</p>
          {item.body ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p> : null}
        </article>
      ))}
    </section>
  );
}
