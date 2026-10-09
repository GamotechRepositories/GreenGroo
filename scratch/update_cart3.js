const fs = require('fs');
const file = 'frontend/src/pages/Cart.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /function CartSidebarSection\(\{ items, storeSettings \}\) \{[\s\S]*?\}\n/m;

const replacementStr = `function CartSidebarSection({ items, storeSettings }) {
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.discountedPrice || 0) * Number(item.quantity || 0),
    0
  );

  useEffect(() => {
    let active = true;
    setLoadingCoupons(true);
    getAvailableCoupons({ subtotal })
      .then(({ data }) => {
        if (active) setCoupons(data.data || []);
      })
      .catch(() => {
        if (active) setCoupons([]);
      })
      .finally(() => {
        if (active) setLoadingCoupons(false);
      });
    return () => { active = false; };
  }, [subtotal]);

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      {!loadingCoupons && coupons.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Coupons & Offers</h2>
            <Link to="/coupons" className="text-xs font-semibold text-[#0C831F] hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {coupons.slice(0, 2).map(coupon => (
              <div key={coupon.code} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0C831F] text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                   <p className="text-xs font-bold text-slate-900">{formatCouponHeadline(coupon)}</p>
                   <p className={\`text-[10px] font-semibold mt-0.5 \${coupon.unlocked ? 'text-emerald-700' : 'text-amber-600'}\`}>
                     {formatCouponUnlockMessage(coupon)}
                   </p>
                   <div className="mt-2 flex items-center justify-between">
                     <span className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-700">
                       {coupon.code}
                     </span>
                     <Link to="/coupons" className="text-[10px] font-bold text-[#0C831F] hover:underline">Apply</Link>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <OrderSummary items={items} storeSettings={storeSettings} />
    </div>
  );
}
`;

if (content.match(targetRegex)) {
  content = content.replace(targetRegex, replacementStr);
  fs.writeFileSync(file, content);
  console.log('Cart.jsx updated');
} else {
  console.log('regex match failed');
}
