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
    <section className="mb-3 space-y-2 sm:mb-4">
      {items.slice(0, 5).map((item) => (
        <article
          key={item._id}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:text-[11px]">
            Announcement
          </p>
          <p className="mt-0.5 break-words text-[13px] font-semibold text-slate-900 sm:text-sm">{item.title}</p>
          {item.body ? <p className="mt-1 whitespace-pre-wrap break-words text-[12px] text-slate-600 sm:text-sm">{item.body}</p> : null}
        </article>
      ))}
    </section>
  );
}
