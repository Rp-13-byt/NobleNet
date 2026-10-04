import { apiClient } from './apiClient';

export interface WishlistItem {
  id: string;
  _id?: string;
  wishlistId: string;
  ngoId?: string;
  name: string;
  itemName?: string;
  category: string;
  description?: string;
  requiredQuantity: number;
  pledgedQuantity: number;
  fulfilledQuantity?: number;
  priority: 'High' | 'Medium' | 'Low' | string;
  imageUrl: string;
}

export interface Wishlist {
  id: string;
  _id?: string;
  ngoId: any;
  title: string;
  description: string;
  status: string;
  items?: WishlistItem[];
}

export const wishlistService = {
  async getWishlists(ngoId?: string): Promise<Wishlist[]> {
    const query = ngoId ? `?ngoId=${ngoId}` : '';
    const res = await apiClient.get<any[]>(`/wishlists${query}`);
    return (res || []).map(w => ({
      id: w._id || w.id,
      ngoId: typeof w.ngoId === 'object' && w.ngoId ? w.ngoId._id || w.ngoId.id : w.ngoId,
      title: w.title,
      description: w.description,
      status: w.status,
    }));
  },

  async getItemsByWishlist(wishlistId: string): Promise<WishlistItem[]> {
    const res = await apiClient.get<any[]>(`/wishlists/${wishlistId}/items`);
    return (res || []).map(item => ({
      id: item._id || item.id,
      wishlistId: item.wishlistId,
      name: item.itemName || item.name,
      category: item.category,
      description: item.description,
      requiredQuantity: item.requiredQuantity,
      pledgedQuantity: item.pledgedQuantity || 0,
      fulfilledQuantity: item.fulfilledQuantity || 0,
      priority: item.priority === 'HIGH' ? 'High' : item.priority === 'LOW' ? 'Low' : 'Medium',
      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=400',
    }));
  },

  async getAllWishlistItems(): Promise<WishlistItem[]> {
    const wishlists = await this.getWishlists();
    const itemPromises = wishlists.map(async w => {
      const items = await this.getItemsByWishlist(w.id);
      return items.map(i => ({
        ...i,
        ngoId: typeof w.ngoId === 'string' ? w.ngoId : w.ngoId?._id || w.ngoId?.id,
      }));
    });
    const itemArrays = await Promise.all(itemPromises);
    return itemArrays.flat();
  },

  async pledgeItem(itemId: string, quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post(`/wishlists/items/${itemId}/pledge`, { quantity });
      return {
        success: true,
        message: 'Successfully pledged! The NGO has been notified of your contribution.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to pledge item. It might be already claimed.',
      };
    }
  },

  async getMyItemDonations(): Promise<any[]> {
    return apiClient.get<any[]>('/wishlists/my/item-donations');
  },
};
