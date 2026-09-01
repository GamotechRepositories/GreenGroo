import React from 'react';
import { Landmark } from 'lucide-react';
import AdminModulePage from '../../components/ops/AdminModulePage';

export default function FinanceManagement() {
  return (
    <AdminModulePage
      title="Finance Management"
      description="Record payouts, expenses, settlements, and view sales totals."
      icon={Landmark}
      path="finance"
      createLabel="Add entry"
      searchKeys={['title', 'type', 'storeName', 'vendorName', 'reference']}
      statusFilters={[]}
      columns={[
        { key: 'date', label: 'Date', render: (row) => new Date(row.date || row.createdAt).toLocaleDateString('en-IN') },
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title' },
        { key: 'amount', label: 'Amount', render: (row) => `₹${Number(row.amount || 0).toLocaleString('en-IN')}` },
        { key: 'storeName', label: 'Store / vendor', render: (row) => row.storeName || row.vendorName || '—' },
      ]}
      defaults={{ type: 'income', title: '', amount: '', storeName: '', vendorName: '', reference: '', notes: '' }}
      fields={[
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: [
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
            { value: 'payout', label: 'Payout' },
            { value: 'settlement', label: 'Settlement' },
          ],
        },
        { name: 'title', label: 'Title', required: true },
        { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
        { name: 'storeName', label: 'Store' },
        { name: 'vendorName', label: 'Vendor' },
        { name: 'reference', label: 'Reference' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
