import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Label,
} from "recharts";
import { EXCEL_PANEL, EXCEL_PANEL_HEAD } from "../../utils/excelStyles";

const COLORS = {
  green: "#217346",
  emerald: "#059669",
  soft: "#34d399",
  amber: "#d97706",
  sky: "#0284c7",
  rose: "#dc2626",
  slate: "#64748b",
  violet: "#7c3aed",
};

const PIE_COLORS = [COLORS.green, COLORS.amber, COLORS.sky, COLORS.emerald, COLORS.rose, COLORS.violet, COLORS.slate];

const STATUS_COLORS = {
  Approved: COLORS.emerald,
  Completed: COLORS.emerald,
  Paid: COLORS.emerald,
  Available: COLORS.sky,
  Pending: COLORS.amber,
  "In Progress": COLORS.sky,
  Rejected: COLORS.rose,
  Cancelled: COLORS.rose,
};

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(5, 10) || iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function dayKey(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  return d.toISOString().slice(0, 10);
}

function lastNDays(n = 14) {
  const days = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: shortDate(key) });
  }
  return days;
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`${EXCEL_PANEL} overflow-hidden ${className}`}>
      <div className={EXCEL_PANEL_HEAD}>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          {subtitle ? <p className="mt-0.5 text-[11px] font-normal text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="px-2 pb-3 pt-2 sm:px-3">{children}</div>
    </section>
  );
}

function EmptyChart({ label = "No data yet" }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-xs font-medium text-slate-400">
      {label}
    </div>
  );
}

function tooltipStyle() {
  return {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
    fontSize: 12,
  };
}

function buildTrend(harvestOrders = [], earnings = []) {
  const days = lastNDays(14);
  const map = Object.fromEntries(
    days.map((d) => [d.key, { label: d.label, harvestQty: 0, harvestAmount: 0, earnings: 0 }])
  );

  harvestOrders.forEach((o) => {
    const key = dayKey(o.date || o.harvestDate || o.createdAt);
    if (!map[key]) return;
    map[key].harvestQty += Number(o.totalQuantity || o.orderedQuantity || 0);
    map[key].harvestAmount += Number(o.totalAmount || o.orderValue || o.amount || 0);
  });

  earnings.forEach((e) => {
    const key = dayKey(e.date || e.pickupDate || e.createdAt);
    if (!map[key]) return;
    map[key].earnings += Number(e.netEarnings || e.grossEarnings || e.amount || 0);
  });

  return days.map((d) => map[d.key]);
}

function buildStackedGrades(harvestOrders = [], products = []) {
  if (harvestOrders.length > 0) {
    const byProduct = new Map();
    harvestOrders.forEach((o) => {
      const name = String(o.productName || o.name || "Produce").trim() || "Produce";
      const row = byProduct.get(name) || { name: name.slice(0, 16), gradeA: 0, gradeB: 0, gradeC: 0, other: 0 };
      const grades = Array.isArray(o.grades) ? o.grades : [];
      if (grades.length === 0) {
        row.other += Number(o.totalQuantity || 0);
      } else {
        grades.forEach((g) => {
          const label = String(g.name || g.grade || "").toLowerCase();
          const qty = Number(g.quantity || g.qty || 0);
          if (label.includes("a")) row.gradeA += qty;
          else if (label.includes("b")) row.gradeB += qty;
          else if (label.includes("c")) row.gradeC += qty;
          else row.other += qty;
        });
      }
      byProduct.set(name, row);
    });
    return [...byProduct.values()].sort((a, b) => b.gradeA + b.gradeB + b.gradeC + b.other - (a.gradeA + a.gradeB + a.gradeC + a.other)).slice(0, 8);
  }

  return (products || []).slice(0, 8).map((p) => ({
    name: String(p.productName || p.name || "Product").slice(0, 16),
    gradeA: Number(p.gradeAQty || p.grades?.[0]?.quantity || 0),
    gradeB: Number(p.gradeBQty || p.grades?.[1]?.quantity || 0),
    gradeC: Number(p.grades?.[2]?.quantity || 0),
    other: 0,
  }));
}

function buildProductPie(harvestOrders = [], products = []) {
  const map = new Map();
  if (harvestOrders.length > 0) {
    harvestOrders.forEach((o) => {
      const name = String(o.productName || o.name || "Produce").trim() || "Produce";
      map.set(name, (map.get(name) || 0) + Number(o.totalQuantity || o.orderedQuantity || 0));
    });
  } else {
    (products || []).forEach((p) => {
      const name = String(p.productName || p.name || "Product").trim() || "Product";
      const qty =
        Number(p.stock || 0) ||
        Number(p.gradeAQty || 0) + Number(p.gradeBQty || 0) ||
        Number(p.grades?.[0]?.quantity || 0) + Number(p.grades?.[1]?.quantity || 0);
      map.set(name, (map.get(name) || 0) + qty);
    });
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name: name.slice(0, 18), value: Math.round(value) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}

function buildStatusDonut(harvestOrders = [], earnings = [], stats = {}) {
  const counts = {};
  if (harvestOrders.length > 0) {
    harvestOrders.forEach((o) => {
      const s = String(o.status || "Pending").trim() || "Pending";
      counts[s] = (counts[s] || 0) + 1;
    });
  } else if (earnings.length > 0) {
    earnings.forEach((e) => {
      const s = String(e.status || "Pending").trim() || "Pending";
      counts[s] = (counts[s] || 0) + 1;
    });
  } else {
    const pending = Number(stats.pendingOrders || 0);
    const completed = Number(stats.completedOrders || 0);
    const total = Number(stats.totalOrders || 0);
    if (pending || completed || total) {
      counts.Pending = pending;
      counts.Completed = completed;
      const other = Math.max(total - pending - completed, 0);
      if (other > 0) counts.Other = other;
    }
  }
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || COLORS.slate,
  }));
}

function buildScatter(harvestOrders = [], earnings = []) {
  const fromHarvest = harvestOrders
    .map((o) => {
      const qty = Number(o.totalQuantity || o.orderedQuantity || 0);
      const amount = Number(o.totalAmount || o.orderValue || o.amount || 0);
      if (!(qty > 0) || !(amount > 0)) return null;
      return {
        x: qty,
        y: amount,
        z: Math.max(8, Math.min(28, Math.sqrt(qty))),
        name: o.productName || "Harvest",
      };
    })
    .filter(Boolean);

  if (fromHarvest.length > 0) return fromHarvest.slice(0, 40);

  return earnings
    .map((e) => {
      const qty = Number(e.quantity || 0);
      const amount = Number(e.netEarnings || e.grossEarnings || 0);
      if (!(qty > 0) || !(amount > 0)) return null;
      return {
        x: qty,
        y: amount,
        z: Math.max(8, Math.min(28, Math.sqrt(qty))),
        name: e.cropName || "Earning",
      };
    })
    .filter(Boolean)
    .slice(0, 40);
}

function buildCategoryBars(products = [], harvestOrders = []) {
  const map = new Map();
  if (harvestOrders.length > 0) {
    harvestOrders.forEach((o) => {
      const cat = String(o.category || "Other").trim() || "Other";
      map.set(cat, (map.get(cat) || 0) + Number(o.totalAmount || 0));
    });
  } else {
    (products || []).forEach((p) => {
      const cat = String(p.category || "Other").trim() || "Other";
      const stock = Number(p.stock || 0);
      const price = Number(p.sellingPrice || 0);
      map.set(cat, (map.get(cat) || 0) + stock * price);
    });
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export default function FarmerDashboardCharts({
  harvestOrders = [],
  earnings = [],
  products = [],
  stats = {},
}) {
  const trend = useMemo(() => buildTrend(harvestOrders, earnings), [harvestOrders, earnings]);
  const stacked = useMemo(() => buildStackedGrades(harvestOrders, products), [harvestOrders, products]);
  const productPie = useMemo(() => buildProductPie(harvestOrders, products), [harvestOrders, products]);
  const statusDonut = useMemo(
    () => buildStatusDonut(harvestOrders, earnings, stats),
    [harvestOrders, earnings, stats]
  );
  const scatter = useMemo(() => buildScatter(harvestOrders, earnings), [harvestOrders, earnings]);
  const categoryBars = useMemo(() => buildCategoryBars(products, harvestOrders), [products, harvestOrders]);

  const hasTrend = trend.some((d) => d.harvestQty > 0 || d.harvestAmount > 0 || d.earnings > 0);
  const hasStacked = stacked.some((d) => d.gradeA + d.gradeB + d.gradeC + d.other > 0);
  const pieTotal = productPie.reduce((s, d) => s + d.value, 0);
  const donutTotal = statusDonut.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Detailed Analytics</h2>
          <p className="text-xs text-slate-500">Harvest, earnings, grade mix and product performance</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Earnings & harvest trend" subtitle="Line chart · last 14 days">
          {hasTrend ? (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={42} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle()}
                    formatter={(value, name) => {
                      if (name === "Earnings (₹)" || name === "Harvest value (₹)") return [formatInr(value), name];
                      return [`${Number(value).toLocaleString("en-IN")} kg`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="harvestQty"
                    name="Harvest qty (kg)"
                    stroke={COLORS.green}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: COLORS.green }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="earnings"
                    name="Earnings (₹)"
                    stroke={COLORS.amber}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: COLORS.amber }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="harvestAmount"
                    name="Harvest value (₹)"
                    stroke={COLORS.sky}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="No harvest or earnings trend yet" />
          )}
        </ChartCard>

        <ChartCard title="Grade-wise quantity by product" subtitle="Stacked column chart · A / B / C grades">
          {hasStacked ? (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stacked} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={tooltipStyle()}
                    formatter={(value, name) => [`${Number(value).toLocaleString("en-IN")} kg`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="gradeA" name="Grade A" stackId="g" fill={COLORS.green} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="gradeB" name="Grade B" stackId="g" fill={COLORS.amber} />
                  <Bar dataKey="gradeC" name="Grade C" stackId="g" fill={COLORS.sky} />
                  <Bar dataKey="other" name="Other" stackId="g" fill={COLORS.slate} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="No grade quantity data yet" />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Product quantity share" subtitle="Pie chart">
          {pieTotal > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {productPie.map((_, i) => (
                      <Cell key={`pie-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle()}
                    formatter={(value, name) => [`${Number(value).toLocaleString("en-IN")} kg`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="No product share data yet" />
          )}
        </ChartCard>

        <ChartCard title="Order / harvest status" subtitle="Donut chart">
          {donutTotal > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDonut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {statusDonut.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        const { cx, cy } = viewBox || {};
                        if (cx == null || cy == null) return null;
                        return (
                          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={cx} dy="-0.2em" fill="#1e293b" fontSize="22" fontWeight="700">
                              {donutTotal}
                            </tspan>
                            <tspan x={cx} dy="1.5em" fill="#94a3b8" fontSize="10" fontWeight="600">
                              Total
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [value, name]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="No status data yet" />
          )}
        </ChartCard>

        <ChartCard title="Quantity vs value" subtitle="Scatter chart · kg vs ₹" className="lg:col-span-2 xl:col-span-1">
          {scatter.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Qty"
                    unit=" kg"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Value"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                  />
                  <ZAxis type="number" dataKey="z" range={[60, 280]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={tooltipStyle()}
                    formatter={(value, name) => {
                      if (name === "Qty") return [`${Number(value).toLocaleString("en-IN")} kg`, "Quantity"];
                      if (name === "Value") return [formatInr(value), "Value"];
                      return [value, name];
                    }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.name || "Point"}
                  />
                  <Scatter name="Orders" data={scatter} fill={COLORS.emerald} fillOpacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="No qty/value points yet" />
          )}
        </ChartCard>
      </div>

      <ChartCard title="Category performance" subtitle="Column chart · estimated value by category">
        {categoryBars.length > 0 ? (
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBars} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [formatInr(value), "Value"]} />
                <Bar dataKey="value" name="Value" fill={COLORS.emerald} radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart label="No category data yet" />
        )}
      </ChartCard>
    </div>
  );
}
