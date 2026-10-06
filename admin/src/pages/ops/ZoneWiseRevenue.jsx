import React from 'react';
import { MapPinned } from 'lucide-react';
import AdminModulePage from '../../components/ops/AdminModulePage';

export default function ZoneWiseRevenue() {
  return (
    <AdminModulePage
      title="Zone-wise Revenue"
      description="View dynamically calculated revenue breakdown by zone based on delivered orders."
      icon={MapPinned}
      path="finance/zone-revenue"
      searchKeys={['zoneName', 'revenue']}
      statusFilters={[]}
      columns={[
        { key: 'zoneName', label: 'Zone' },
        { key: 'ordersCount', label: 'Orders' },
        { key: 'revenue', label: 'Revenue', render: (row) => `₹${Number(row.revenue || 0).toLocaleString('en-IN')}` },
      ]}
      defaults={null}
      fields={[]}
    />
  );
}
