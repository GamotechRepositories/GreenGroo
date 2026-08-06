/** Outline SVG icons for grocery categories (no emojis). */
function IconShell({ children, className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function AllIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4 10h16l-1.2 9.2A2 2 0 0116.82 21H7.18a2 2 0 01-1.98-1.8L4 10z" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </IconShell>
  );
}

function FruitsIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 22c4.5 0 7-2.8 7-7.2 0-3.6-2.2-6.3-4.8-7.5.6-1.2.7-2.3.4-3.3-.8.5-1.7.8-2.6.8S10.2 4.5 9.4 4c-.3 1-.2 2.1.4 3.3C7.2 8.5 5 11.2 5 14.8 5 19.2 7.5 22 12 22z" />
      <path d="M12 4.5c0-1 .4-1.9 1.1-2.5" />
    </IconShell>
  );
}

function VegetablesIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 22c3.5 0 6-2.2 6-5.5 0-2.8-1.8-4.8-4-5.8 1.2-.9 2-2.3 2-3.9C16 4.5 14.2 3 12 3S8 4.5 8 6.8c0 1.6.8 3 2 3.9-2.2 1-4 3-4 5.8C6 19.8 8.5 22 12 22z" />
      <path d="M12 10.5V3" />
    </IconShell>
  );
}

function OrganicIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M5 19c6-1 10-5 12-12 0 0-5 1-8 4S5 19 5 19z" />
      <path d="M9 13c2 2 5 4 8 5" />
    </IconShell>
  );
}

function DairyIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M8 7h8l1 3v9a2 2 0 01-2 2H9a2 2 0 01-2-2V10l1-3z" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
      <path d="M8 11h8" />
    </IconShell>
  );
}

function CarrotIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 22c2.5-3.5 4-7.5 4-11H8c0 3.5 1.5 7.5 4 11z" />
      <path d="M10 5c.5 1.5 1.2 2.5 2 3 .8-.5 1.5-1.5 2-3" />
      <path d="M12 8V4M9.5 5.5 8 3M14.5 5.5 16 3" />
    </IconShell>
  );
}

function BasketIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4 10h16l-1.2 9.2A2 2 0 0116.82 21H7.18a2 2 0 01-1.98-1.8L4 10z" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </IconShell>
  );
}

const ICONS_BY_KEY = {
  all: AllIcon,
  fruits: FruitsIcon,
  fruit: FruitsIcon,
  vegetables: VegetablesIcon,
  vegetable: VegetablesIcon,
  veggies: VegetablesIcon,
  organic: OrganicIcon,
  dairy: DairyIcon,
  milk: DairyIcon,
  carrots: CarrotIcon,
  carrot: CarrotIcon,
};

const FALLBACK_ICONS = [BasketIcon, FruitsIcon, VegetablesIcon, OrganicIcon, DairyIcon, CarrotIcon];

function resolveCategoryKey(name = "") {
  return String(name).trim().toLowerCase();
}

export function getCategoryIcon(name, index = 0) {
  const key = resolveCategoryKey(name);
  if (ICONS_BY_KEY[key]) return ICONS_BY_KEY[key];
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

function CategoryIcon({ name, index = 0, className = "h-6 w-6" }) {
  const Icon = getCategoryIcon(name, index);
  return <Icon className={className} />;
}

export default CategoryIcon;
