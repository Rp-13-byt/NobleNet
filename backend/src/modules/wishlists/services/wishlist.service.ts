import { Wishlist, WishlistStatus } from '../models/Wishlist';
import { WishlistItem, WishlistItemStatus } from '../models/WishlistItem';
import { ItemDonation, ItemDonationStatus } from '../models/ItemDonation';
import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { AppError } from '../../../core/errors/AppError';
import { eventEmitter, AppEvents } from '../../../events/EventEmitter';

export class WishlistService {
  static async createWishlist(userId: string, data: { title: string; description: string }) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');
    if (ngo.status !== NgoStatus.VERIFIED) throw new AppError('NGO must be verified', 403, 'NGO_NOT_VERIFIED');

    return Wishlist.create({ ...data, ngoId: ngo._id });
  }

  static async getWishlists(ngoId?: string) {
    const query: Record<string, unknown> = { status: WishlistStatus.ACTIVE };
    if (ngoId) query.ngoId = ngoId;
    return Wishlist.find(query).populate('ngoId', 'organizationName');
  }

  static async getWishlistById(id: string) {
    const wishlist = await Wishlist.findById(id).populate('ngoId', 'organizationName');
    if (!wishlist) throw new AppError('Wishlist not found', 404, 'WISHLIST_NOT_FOUND');
    return wishlist;
  }

  static async addItem(userId: string, wishlistId: string, data: Record<string, unknown>) {
    const wishlist = await Wishlist.findById(wishlistId);
    if (!wishlist) throw new AppError('Wishlist not found', 404, 'WISHLIST_NOT_FOUND');

    const ngo = await NGO.findOne({ _id: wishlist.ngoId, userId });
    if (!ngo) throw new AppError('Not authorized', 403, 'FORBIDDEN');

    return WishlistItem.create({ ...data, wishlistId });
  }

  static async getItemsByWishlist(wishlistId: string) {
    return WishlistItem.find({ wishlistId });
  }

  /**
   * Concurrency-safe atomic inventory reservation
   */
  static async pledgeItem(userId: string, itemId: string, quantity: number, deliveryMode = 'SELF_DELIVERY') {
    const remaining = { $expr: { $gte: [{ $subtract: ['$requiredQuantity', { $add: ['$fulfilledQuantity', '$pledgedQuantity'] }] }, quantity] } };

    const updatedItem = await WishlistItem.findOneAndUpdate(
      { _id: itemId, status: { $ne: WishlistItemStatus.FULFILLED }, ...remaining },
      { $inc: { pledgedQuantity: quantity, version: 1 } },
      { new: true }
    );

    if (!updatedItem) {
      const item = await WishlistItem.findById(itemId);
      if (!item) throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');

      const availableQty = Math.max(0, item.requiredQuantity - item.fulfilledQuantity - item.pledgedQuantity);
      throw new AppError(
        availableQty > 0
          ? `Only ${availableQty} item(s) remaining. Please reduce your requested quantity.`
          : 'The requested quantity is no longer available',
        409,
        'INSUFFICIENT_ITEM_QUANTITY'
      );
    }

    const totalCommitted = updatedItem.fulfilledQuantity + updatedItem.pledgedQuantity;
    if (totalCommitted >= updatedItem.requiredQuantity) {
      updatedItem.status = WishlistItemStatus.FULFILLED;
      await updatedItem.save();
    } else if (totalCommitted > 0) {
      updatedItem.status = WishlistItemStatus.PARTIALLY_FULFILLED;
      await updatedItem.save();
    }

    const pledge = await ItemDonation.create({
      userId,
      wishlistItemId: itemId,
      quantity,
      deliveryMode,
      status: ItemDonationStatus.RESERVED,
    });

    eventEmitter.emit(AppEvents.WISHLIST_ITEM_UPDATED, {
      itemId,
      quantity,
      item: updatedItem,
    });

    return { pledge, item: updatedItem };
  }

  static async getUserItemDonations(userId: string) {
    return ItemDonation.find({ userId }).populate('wishlistItemId').sort({ createdAt: -1 });
  }

  static async cancelPledge(pledgeId: string, userId: string) {
    const pledge = await ItemDonation.findOne({ _id: pledgeId, userId, status: ItemDonationStatus.RESERVED });
    if (!pledge) throw new AppError('Reservation not found or cannot be cancelled', 404, 'PLEDGE_NOT_FOUND');

    await WishlistItem.findByIdAndUpdate(pledge.wishlistItemId, {
      $inc: { pledgedQuantity: -pledge.quantity, version: 1 },
    });

    pledge.status = ItemDonationStatus.CANCELLED;
    await pledge.save();
    return { success: true, message: 'Item reservation cancelled' };
  }
}
