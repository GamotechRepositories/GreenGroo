import React from 'react';
import { BadgePercent } from 'lucide-react';
import AdminModulePage from '../../components/ops/AdminModulePage';

export default function DynamicPricing() {
  return (
    <AdminModulePage
      title="Dynamic Pricing"
      description="Quantity rules such as Buy 10 units → Get 5% off."
      icon={BadgePercent}
      path="pricing"
      createLabel="Add pricing rule"
      searchKeys={['name', 'applyTo']}
      columns={[
        { key: 'name', label: 'Rule' },
        { key: 'minQuantity', label: 'Min qty' },
        {
          key: 'discount',
          label: 'Discount',
          render: (row) =>
            row.discountType === 'fixed' ? `₹${row.discountValue} off` : `${row.discountValue}% off`,
        },
        { key: 'applyTo', label: 'Applies to' },
        { key: 'enabled', label: 'Live', render: (row) => (row.enabled ? 'Yes' : 'No') },
      ]}
      defaults={{
        name: 'Buy 10 units · Get 5% off',
        minQuantity: 10,
        discountType: 'percentage',
        discountValue: 5,
        applyTo: 'all',
        categoryNames: '',
        enabled: true,
      }}
      fields={[
        { name: 'name', label: 'Rule name', required: true },
        { name: 'minQuantity', label: 'Buy quantity', type: 'number', required: true },
        {
          name: 'discountType',
          label: 'Discount type',
          type: 'select',
          options: [
            { value: 'percentage', label: 'Percentage' },
            { value: 'fixed', label: 'Fixed ₹' },
          ],
        },
        { name: 'discountValue', label: 'Discount value', type: 'number', required: true },
        {
          name: 'applyTo',
          label: 'Apply to',
          type: 'select',
          options: [
            { value: 'all', label: 'All products' },
            { value: 'categories', label: 'Selected categories' },
            { value: 'products', label: 'Selected products' },
          ],
        },
        { name: 'categoryNames', label: 'Categories (comma separated)' },
        { name: 'enabled', label: 'Enabled', type: 'checkbox' },
      ]}
    />
  );
}
