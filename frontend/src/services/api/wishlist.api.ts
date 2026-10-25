import { apiClient } from '../apiClient';

export const wishlistApi = {
  getAll: (ngoId?: string) => {
    return apiClient.get(`/wishlists${ngoId ? `?ngoId=${ngoId}` : ''}`);
  },

  getItems: (wishlistId: string) => {
    return apiClient.get(`/wishlists/${wishlistId}/items`);
  },

  pledge: (itemId: string, quantity: number, deliveryMode = 'SELF_DELIVERY') => {
    return apiClient.post(`/wishlists/items/${itemId}/pledge`, { quantity, deliveryMode });
  },

  getMyPledges: () => {
    return apiClient.get('/wishlists/my-donations');
  },
};
