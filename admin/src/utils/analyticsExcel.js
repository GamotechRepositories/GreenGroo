const STATUS_LABELS = {
  attempted: 'Abandoned checkout',
  confirm: 'Confirmed',
  processing: 'Processing',
  shipping: 'Shipping',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return: 'Returned',
  preorder_hold: 'Preorder hold',
  incoming: 'Incoming',
  order_received: 'Received',
  stock_issue: 'Stock issue',
  packed: 'Packed',
  offered: 'Offered',
  assigned: 'Assigned',
  pickup_verified: 'Picked up',
  out_for_delivery: 'Out for delivery',
  delivery_failed: 'Failed',
  on_delivery: 'On delivery',
};

const DEPARTMENT_LABELS = {
  preorder: 'Preorder',
  ready2cook: 'Ready2Cook',
  instant: 'Instant Order',
  unassigned: 'Not tagged',
};

const xmlEscape = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const humanize = (s) => {
  const raw = String(s || '').trim();
  if (!raw) return '';
  if (STATUS_LABELS[raw]) return STATUS_LABELS[raw];
  if (DEPARTMENT_LABELS[raw]) return DEPARTMENT_LABELS[raw];
  const spaced = raw.replace(/[_-]+/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const share = (part, total, digits = 1) => {
  if (!total) return 0;
  const f = 10 ** digits;
  return Math.round((Number(part || 0) / total) * 100 * f) / f;
};

function cellXml(value) {
  if (value == null || value === '') return '<Cell/>';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell ss:StyleID="n"><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `<Cell><Data ss:Type="String">${xmlEscape(value.toISOString())}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function sheetXml(name, headers, rows) {
  const header = `<Row ss:StyleID="h">${headers.map((h) => `<Cell ss:StyleID="h"><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`).join('')}</Row>`;
  const body = rows.map((row) => `<Row>${row.map(cellXml).join('')}</Row>`).join('');
  return `<Worksheet ss:Name="${xmlEscape(String(name).slice(0, 31))}"><Table>${header}${body}</Table></Worksheet>`;
}

function withShare(rows, valueKey) {
  const total = (rows || []).reduce((s, r) => s + Number(r[valueKey] || 0), 0);
  return { total, rows: rows || [] };
}

function buildSheets(data) {
  const { range = {}, kpis = {}, sales = {}, products = {}, customers = {}, delivery = {}, supply = {}, finance = {}, filters = {} } = data;
  const sheets = [];

  sheets.push({
    name: 'Overview KPIs',
    headers: ['Metric', 'Current', 'Previous period', 'Change %'],
    rows: Object.entries(kpis).map(([key, kpi]) => [
      humanize(key),
      Number(kpi?.value) || 0,
      Number(kpi?.previous) || 0,
      kpi?.change == null ? '' : Number(kpi.change),
    ]),
  });

  sheets.push({
    name: 'Filters',
    headers: ['Field', 'Value'],
    rows: [
      ['From', range.from || ''],
      ['To', range.to || ''],
      ['Compared from', range.previousFrom || ''],
      ['Compared to', range.previousTo || ''],
      ['City', filters.city || 'All'],
      ['Dark store', filters.store || 'All'],
      ['Department', filters.department ? humanize(filters.department) : 'All'],
      ['Payment', filters.payment || 'All'],
      ['Customer type', filters.accountType || 'All'],
      ['Generated at', data.generatedAt || ''],
    ],
  });

  sheets.push({
    name: 'Sales trend',
    headers: ['Date', 'Orders', 'Order value', 'Revenue (delivered)', 'Delivered orders', 'Cancelled / returned'],
    rows: (sales.trend || []).map((r) => [r.date, r.orders || 0, r.gmv || 0, r.revenue || 0, r.delivered || 0, r.cancelled || 0]),
  });

  const statusShare = withShare(sales.statuses, 'value');
  const statusOrderShare = withShare(sales.statuses, 'orders');
  sheets.push({
    name: 'Order status value',
    headers: ['Status', 'Orders', 'Orders %', 'Value (₹)', 'Value %'],
    rows: (sales.statuses || []).map((r) => [
      humanize(r.status),
      r.orders || 0,
      share(r.orders, statusOrderShare.total),
      r.value || 0,
      share(r.value, statusShare.total),
    ]),
  });

  const cityShare = withShare(sales.cities, 'gmv');
  sheets.push({
    name: 'Order value by city',
    headers: ['City', 'Orders', 'Order value (₹)', 'Value %', 'Revenue delivered (₹)'],
    rows: (sales.cities || []).map((r) => [
      r.city || 'Unknown',
      r.orders || 0,
      r.gmv || 0,
      share(r.gmv, cityShare.total),
      r.revenue || 0,
    ]),
  });

  sheets.push({
    name: 'Busiest areas',
    headers: ['Area', 'City', 'Dark store ID', 'Dark store name', 'Orders', 'Order value (₹)'],
    rows: (sales.areas || []).map((r) => [
      r.area || 'Unknown',
      r.city || '',
      r.darkStoreId || '',
      r.storeName || '',
      r.orders || 0,
      r.gmv || 0,
    ]),
  });

  sheets.push({
    name: 'Payments',
    headers: ['Method', 'Orders', 'Value (₹)', 'Value %'],
    rows: (() => {
      const { total } = withShare(sales.payments, 'value');
      return (sales.payments || []).map((r) => [
        r.method === 'cod' ? 'Cash on delivery' : r.method === 'online' ? 'Online' : humanize(r.method),
        r.orders || 0,
        r.value || 0,
        share(r.value, total),
      ]);
    })(),
  });

  sheets.push({
    name: 'Fulfilment',
    headers: ['Type', 'Orders', 'Value (₹)'],
    rows: (sales.fulfilment || []).map((r) => [
      r.type === 'pickup' ? 'Store pickup' : 'Home delivery',
      r.orders || 0,
      r.value || 0,
    ]),
  });

  sheets.push({
    name: 'Departments',
    headers: ['Department', 'Orders', 'Units', 'Value (₹)'],
    rows: (sales.departments || []).map((r) => [humanize(r.department), r.orders || 0, r.units || 0, r.value || 0]),
  });

  const promo = sales.promotions || {};
  sheets.push({
    name: 'Promotions',
    headers: ['Metric', 'Value'],
    rows: [
      ['Coupon discount (₹)', promo.couponDiscount || 0],
      ['Reward discount (₹)', promo.rewardDiscount || 0],
      ['Gift card discount (₹)', promo.giftCardDiscount || 0],
      ['Delivery charges (₹)', promo.deliveryCharges || 0],
      ['GST collected (₹)', promo.gst || 0],
      ['Orders with coupon', promo.couponOrders || 0],
      ['Orders', promo.orders || 0],
      ['Points earned', promo.pointsEarned || 0],
      ['Points redeemed', promo.pointsUsed || 0],
    ],
  });

  sheets.push({
    name: 'Coupons',
    headers: ['Code', 'Uses', 'Discount (₹)', 'Order value (₹)'],
    rows: (promo.coupons || []).map((c) => [c.code, c.uses || 0, c.discount || 0, c.value || 0]),
  });

  sheets.push({
    name: 'Products',
    headers: ['Product', 'Department', 'Units', 'Orders', 'Revenue (₹)', 'Share %'],
    rows: (() => {
      const total = (products.top || []).reduce((s, p) => s + Number(p.revenue || 0), 0);
      return (products.top || []).map((p) => [
        p.name,
        humanize(p.department || 'unassigned'),
        p.units || 0,
        p.orders || 0,
        p.revenue || 0,
        share(p.revenue, total),
      ]);
    })(),
  });

  sheets.push({
    name: 'Cancelled products',
    headers: ['Product', 'Units'],
    rows: (products.cancelled || []).map((p) => [p.name, p.units || 0]),
  });

  sheets.push({
    name: 'Customers',
    headers: ['Name', 'Phone', 'Type', 'Orders', 'Spend (₹)', 'Last order'],
    rows: (customers.top || []).map((c) => [
      c.name,
      c.phone || '',
      c.accountType === 'bulk' ? 'Bulk' : 'Retail',
      c.orders || 0,
      c.spend || 0,
      c.last ? new Date(c.last).toLocaleDateString('en-IN') : '',
    ]),
  });

  sheets.push({
    name: 'Dark stores',
    headers: ['Dark store ID', 'Name', 'City', 'Orders', 'Delivered', 'Failed', 'Cancelled', 'Delivered value (₹)', 'Avg minutes', 'Success %'],
    rows: (delivery.stores || []).map((s) => [
      s.id || '',
      s.name || '',
      s.city || '',
      s.orders || 0,
      s.delivered || 0,
      s.failed || 0,
      s.cancelled || 0,
      s.value || 0,
      s.avgMinutes ?? '',
      s.successRate ?? '',
    ]),
  });

  sheets.push({
    name: 'Delivery pipeline',
    headers: ['Status', 'Orders'],
    rows: (delivery.statuses || []).map((s) => [humanize(s.status), s.orders || 0]),
  });

  sheets.push({
    name: 'Riders',
    headers: ['Rider', 'Assigned', 'Delivered', 'Failed', 'Distance (km)', 'Earnings (₹)'],
    rows: (delivery.riders || []).map((r) => [r.name, r.assigned || 0, r.delivered || 0, r.failed || 0, r.km || 0, r.earnings || 0]),
  });

  sheets.push({
    name: 'Supply chain',
    headers: ['Metric', 'Value'],
    rows: [
      ['Vendors', supply.counts?.vendors || 0],
      ['Farmers', supply.counts?.farmers || 0],
      ['Farmer managers', supply.counts?.farmerManagers || 0],
      ['Collection centres', supply.counts?.collectionCentres || 0],
    ],
  });

  sheets.push({
    name: 'Finance',
    headers: ['Type', 'Amount (₹)'],
    rows: Object.entries(finance.totals || {}).map(([type, amount]) => [humanize(type), amount || 0]),
  });

  return sheets;
}

export function downloadAnalyticsExcel(data) {
  const sheets = buildSheets(data);
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="h"><Font ss:Bold="1" ss:Color="#065F46"/><Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/></Style>
    <Style ss:ID="n"><NumberFormat ss:Format="#,##0.00"/></Style>
  </Styles>
  ${sheets.map((s) => sheetXml(s.name, s.headers, s.rows)).join('')}
</Workbook>`;

  const from = data?.range?.from || 'start';
  const to = data?.range?.to || 'end';
  const blob = new Blob([`\uFEFF${xml}`], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `GreenGrocc-Analytics-${from}-to-${to}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default downloadAnalyticsExcel;
