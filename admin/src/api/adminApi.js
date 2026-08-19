import apiClient from './client';
import categoryApi from './categoryApi';

export const adminApi = {
  client: apiClient,
  category: categoryApi,
};

export { categoryApi };
export default adminApi;
