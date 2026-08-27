import apiClient from './client';
import categoryApi from './categoryApi';
import sectionApi from './sectionApi';
import couponApi from './couponApi';

export const adminApi = {
  client: apiClient,
  category: categoryApi,
  section: sectionApi,
  coupon: couponApi,
};

export { categoryApi, sectionApi, couponApi };
export default adminApi;
