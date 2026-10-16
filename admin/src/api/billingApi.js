import apiClient from './client';

export const billingApi = {
  // Fetch real zones and dark stores with associated vendor metadata
  getZonesAndStores: async () => {
    const res = await apiClient.get('/admin-ops/billing/zones-and-stores');
    return res.data;
  },

  // Fetch real products & categories from DB (supports { storeId, vendorId })
  getCatalog: async (params = {}) => {
    const res = await apiClient.get('/admin-ops/billing/catalog', { params });
    return res.data;
  },

  // Fetch real customers from User & Order collections
  getCustomers: async (q = '') => {
    const res = await apiClient.get('/admin-ops/billing/customers', {
      params: q ? { q } : {},
    });
    return res.data;
  },

  // Quick-add new customer into User DB
  createCustomer: async (customerData) => {
    const res = await apiClient.post('/admin-ops/billing/customers', customerData);
    return res.data;
  },

  // Create real bill: decrements inventory, updates loyalty rewardPoints, saves invoice
  createInvoice: async (invoicePayload) => {
    const res = await apiClient.post('/admin-ops/billing/invoices', invoicePayload);
    return res.data;
  },

  // Fetch past real invoices from DB
  getInvoices: async (params = {}) => {
    const res = await apiClient.get('/admin-ops/billing/invoices', { params });
    return res.data;
  },

  // Get live omnichannel stats & register shifts
  getOmnichannelOverview: async () => {
    const res = await apiClient.get('/admin-ops/billing/channels-overview');
    return res.data;
  },
};

export default billingApi;
