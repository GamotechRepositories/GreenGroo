import React from 'react';
import { Package } from 'lucide-react';
import AdminModulePage from '../../components/ops/AdminModulePage';

export default function BestSellingProducts() {
  return (
    <AdminModulePage
      title="Best Selling Products"
      description="View dynamically calculated best selling products by zone or dark store based on delivered orders."
      icon={Package}
      path="finance/best-selling"
      searchKeys={['productName', 'storeName', 'zoneName']}
      statusFilters={[]}
      columns={[
        { key: 'productName', label: 'Product' },
        { key: 'zoneName', label: 'Zone' },
        { key: 'storeName', label: 'Dark Store' },
        { key: 'unitsSold', label: 'Units Sold' },
        { key: 'revenue', label: 'Item revenue', render: (row) => `₹${Number(row.revenue || 0).toLocaleString('en-IN')}` },
      ]}
      defaults={null}
      fields={[]}
    />
  );
}
