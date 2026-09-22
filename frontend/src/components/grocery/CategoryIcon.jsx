/** Outline SVG icons for grocery categories (no photos/emojis). */
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

function GrainsIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 3c-2 3-4 5-4 8a4 4 0 008 0c0-3-2-5-4-8z" />
      <path d="M8 14c-1.5 2-2 3.5-2 5a3 3 0 006 0c0-1.5-.5-3-2-5" />
      <path d="M16 14c-1.5 2-2 3.5-2 5a3 3 0 006 0c0-1.5-.5-3-2-5" />
    </IconShell>
  );
}

function SpicesIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M9 3h6v3H9z" />
      <path d="M8 6h8l1 3v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9l1-3z" />
      <path d="M10 12h4M10 15h4" />
    </IconShell>
  );
}

function BeverageIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M8 4h8l1 4H7l1-4z" />
      <path d="M7 8h10v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8z" />
      <path d="M10 12h4" />
    </IconShell>
  );
}

function BakeryIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4 14c0-3 2.5-5 4.5-5 .8 0 1.5.2 2 .6.5-.4 1.2-.6 2-.6s1.5.2 2 .6c.5-.4 1.2-.6 2-.6C18.5 9 21 11 21 14c0 2-1 4-4 4H8c-3 0-4-2-4-4z" />
      <path d="M8 14h.01M12 14h.01M16 14h.01" />
    </IconShell>
  );
}

function OilIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M10 3h4v3l2 2v11a2 2 0 01-2 2h-4a2 2 0 01-2-2V8l2-2V3z" />
      <path d="M10 12h4" />
    </IconShell>
  );
}

function KnifeIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4 20 14 6l4 4-6 10H4z" />
      <path d="M14 6c1.5-1.5 3.5-2 5-1.5.2 1.8-.8 3.5-2.5 4.5" />
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
  vegies: VegetablesIcon,
  organic: OrganicIcon,
  dairy: DairyIcon,
  milk: DairyIcon,
  curd: DairyIcon,
  carrots: CarrotIcon,
  carrot: CarrotIcon,
  grains: GrainsIcon,
  grain: GrainsIcon,
  pulses: GrainsIcon,
  pulse: GrainsIcon,
  rice: GrainsIcon,
  spices: SpicesIcon,
  spice: SpicesIcon,
  masala: SpicesIcon,
  oils: OilIcon,
  oil: OilIcon,
  beverages: BeverageIcon,
  beverage: BeverageIcon,
  drinks: BeverageIcon,
  drink: BeverageIcon,
  soda: BeverageIcon,
  bakery: BakeryIcon,
  bread: BakeryIcon,
  grocery: BasketIcon,
  household: BasketIcon,
  personal: BasketIcon,
  chopped: KnifeIcon,
  sliced: KnifeIcon,
  peeled: KnifeIcon,
  cleaned: KnifeIcon,
  bhaji: VegetablesIcon,
  leafy: VegetablesIcon,
};

const KEYWORD_RULES = [
  [/fruit/, FruitsIcon],
  [/vegetable|veggie|vegie|bhaji|leafy|salad/, VegetablesIcon],
  [/organic|farm/, OrganicIcon],
  [/dairy|milk|curd|paneer|butter|ghee/, DairyIcon],
  [/carrot/, CarrotIcon],
  [/grain|pulse|rice|wheat|flour|atta/, GrainsIcon],
  [/spice|masala|chili|chilli|pepper/, SpicesIcon],
  [/oil|ghee/, OilIcon],
  [/beverage|drink|juice|soda|tea|coffee/, BeverageIcon],
  [/bakery|bread|cake|biscuit/, BakeryIcon],
  [/chop|slice|peel|clean|cut|ready/, KnifeIcon],
];

const FALLBACK_ICONS = [BasketIcon, FruitsIcon, VegetablesIcon, OrganicIcon, DairyIcon, CarrotIcon];

function resolveCategoryKey(name = "") {
  return String(name).trim().toLowerCase();
}

export function getCategoryIcon(name, index = 0) {
  const key = resolveCategoryKey(name);
  if (ICONS_BY_KEY[key]) return ICONS_BY_KEY[key];

  for (const token of key.split(/[\s&/_,-]+/).filter(Boolean)) {
    if (ICONS_BY_KEY[token]) return ICONS_BY_KEY[token];
  }

  for (const [pattern, Icon] of KEYWORD_RULES) {
    if (pattern.test(key)) return Icon;
  }

  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

function CategoryIcon({ name, index = 0, className = "h-6 w-6" }) {
  const Icon = getCategoryIcon(name, index);
  return <Icon className={className} />;
}

export default CategoryIcon;
