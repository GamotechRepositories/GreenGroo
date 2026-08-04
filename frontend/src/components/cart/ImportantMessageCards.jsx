import { buildCartNoticeBullets } from "../../utils/orderSettings";

function ImportantMessageCard({ title, bullets }) {
  if (!bullets?.length) return null;

  return (
    <div
      className="rounded-xl border border-border-light bg-white p-4 shadow-sm sm:p-5"
      role="note"
      aria-label={title}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </span>
        <h2 className="text-sm font-bold text-red-600 sm:text-base">{title}</h2>
      </div>

      <ul className="space-y-2.5 text-xs leading-relaxed text-text-primary sm:text-sm">
        {bullets.map((bullet, index) => (
          <li key={`${title}-${index}`} className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImportantMessageCards({ settings }) {
  const englishBullets = buildCartNoticeBullets(settings, "en");
  const hindiBullets = buildCartNoticeBullets(settings, "hi");

  return (
    <div className="space-y-4">
      <ImportantMessageCard title="Important Message" bullets={englishBullets} />
      <ImportantMessageCard title="महत्वपूर्ण संदेश" bullets={hindiBullets} />
    </div>
  );
}

export default ImportantMessageCards;
