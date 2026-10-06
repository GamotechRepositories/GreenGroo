import React from 'react';
import { Store } from 'lucide-react';
import AdminModulePage from '../../components/ops/AdminModulePage';

export default function DarkstoreWiseRevenue() {
  return (
    <AdminModulePage
      title="Darkstore-wise Revenue"
      description="View dynamically calculated revenue breakdown by dark store based on delivered orders."
      icon={Store}
      path="finance/darkstore-revenue"
      searchKeys={['storeName', 'zoneName', 'revenue']}
      statusFilters={[]}
      columns={[
        { key: 'storeName', label: 'Dark Store' },
        { key: 'zoneName', label: 'Zone' },
        { key: 'ordersCount', label: 'Orders' },
        { key: 'revenue', label: 'Revenue', render: (row) => `₹${Number(row.revenue || 0).toLocaleString('en-IN')}` },
      ]}
      defaults={null}
      fields={[]}
    />
  );
}
