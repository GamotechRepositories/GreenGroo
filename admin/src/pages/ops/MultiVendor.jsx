import React from 'react';
import { Building2 } from 'lucide-react';
import AdminModulePage from '../../components/ops/AdminModulePage';

export default function MultiVendor() {
  return (
    <AdminModulePage
      title="Multi Vendor"
      description="Onboard vendors, set commission, and approve storefronts."
      icon={Building2}
      path="vendors"
      idKey="id"
      createLabel="Add vendor"
      searchKeys={['vendorName', 'ownerName', 'mobile', 'email', 'city', 'status']}
      columns={[
        { key: 'vendorName', label: 'Vendor', render: (row) => row.vendorName || row.businessName || row.ownerName },
        { key: 'ownerName', label: 'Owner' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'city', label: 'City' },
        { key: 'commissionRate', label: 'Commission', render: (row) => `${row.commissionRate ?? 10}%` },
        { key: 'status', label: 'Status' },
      ]}
      defaults={{
        vendorName: '',
        ownerName: '',
        mobile: '',
        email: '',
        city: '',
        state: '',
        businessAddress: '',
        gstNumber: '',
        commissionRate: 10,
        status: 'Active',
        password: 'vendor123',
      }}
      fields={[
        { name: 'vendorName', label: 'Vendor name', required: true },
        { name: 'ownerName', label: 'Owner name', required: true },
        { name: 'mobile', label: 'Mobile', required: true },
        { name: 'email', label: 'Email' },
        { name: 'city', label: 'City' },
        { name: 'state', label: 'State' },
        { name: 'businessAddress', label: 'Address', type: 'textarea' },
        { name: 'gstNumber', label: 'GST number' },
        { name: 'commissionRate', label: 'Commission %', type: 'number' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'Pending', label: 'Pending' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Suspended', label: 'Suspended' },
          ],
        },
        { name: 'password', label: 'Password' },
      ]}
    />
  );
}
