import React from 'react';
import { RotateCcw } from 'lucide-react';
import AdminModulePage from '../../components/ops/AdminModulePage';

export default function RefundWarranty() {
  return (
    <AdminModulePage
      title="Refund & Warranty"
      description="Approve refunds and log warranty replacements against orders."
      icon={RotateCcw}
      path="refunds"
      createLabel="New claim"
      searchKeys={['orderNumber', 'customerName', 'reason', 'status', 'type']}
      statusFilters={['pending', 'approved', 'rejected', 'processed']}
      columns={[
        { key: 'orderNumber', label: 'Order' },
        { key: 'type', label: 'Type' },
        { key: 'customerName', label: 'Customer' },
        { key: 'amount', label: 'Amount', render: (row) => `₹${Number(row.amount || 0).toLocaleString('en-IN')}` },
        { key: 'status', label: 'Status' },
        { key: 'reason', label: 'Reason' },
      ]}
      defaults={{
        type: 'refund',
        orderNumber: '',
        customerName: '',
        customerPhone: '',
        amount: '',
        reason: '',
        status: 'pending',
        adminNote: '',
      }}
      fields={[
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: [
            { value: 'refund', label: 'Refund' },
            { value: 'warranty', label: 'Warranty' },
          ],
        },
        { name: 'orderNumber', label: 'Order number' },
        { name: 'customerName', label: 'Customer name' },
        { name: 'customerPhone', label: 'Phone' },
        { name: 'amount', label: 'Amount (₹)', type: 'number' },
        { name: 'reason', label: 'Reason', type: 'textarea', required: true },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'processed', label: 'Processed' },
          ],
        },
        { name: 'adminNote', label: 'Admin note', type: 'textarea' },
      ]}
    />
  );
}
