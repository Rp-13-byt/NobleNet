import mongoose from 'mongoose';
import { Wishlist, WishlistStatus } from '../src/modules/wishlists/models/Wishlist';
import { WishlistItem, WishlistItemStatus, ItemPriority } from '../src/modules/wishlists/models/WishlistItem';
import { WishlistService } from '../src/modules/wishlists/services/wishlist.service';
import { AppError } from '../src/core/errors/AppError';

describe('Concurrency & Wishlist Atomic Inventory Tests', () => {
  let wishlistId: string;
  let itemId: string;
  const ngoId = new mongoose.Types.ObjectId();
  const donor1Id = new mongoose.Types.ObjectId().toString();
  const donor2Id = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    const wishlist = await Wishlist.create({
      ngoId,
      title: 'Community Relief Wishlist',
      description: 'Items needed for flood victims',
      status: WishlistStatus.ACTIVE,
    });
    wishlistId = wishlist._id.toString();

    const item = await WishlistItem.create({
      wishlistId: wishlist._id,
      itemName: 'Emergency Medical Kits',
      category: 'Health',
      requiredQuantity: 10,
      fulfilledQuantity: 8, // Exactly 2 remaining!
      pledgedQuantity: 0,
      status: WishlistItemStatus.PARTIALLY_FULFILLED,
      priority: ItemPriority.HIGH,
    });
    itemId = item._id.toString();
  });

  afterAll(async () => {
    await WishlistItem.deleteMany({ wishlistId });
    await Wishlist.deleteMany({ ngoId });
  });

  it('Should atomically allocate items and reject concurrent over-allocation with 409', async () => {
    // Donor 1 attempts to pledge 2 items
    // Donor 2 attempts to pledge 1 item
    // Remaining available is 2. Total requested is 3. Exactly one must succeed, the other gets 409!
    const results = await Promise.allSettled([
      WishlistService.pledgeItem(donor1Id, itemId, 2),
      WishlistService.pledgeItem(donor2Id, itemId, 1),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(409);
    expect((error as AppError).errorCode).toBe('INSUFFICIENT_ITEM_QUANTITY');

    // Verify DB integrity: committed quantity must not exceed requiredQuantity 10
    const updatedItem = await WishlistItem.findById(itemId);
    const totalCommitted = (updatedItem?.fulfilledQuantity || 0) + (updatedItem?.pledgedQuantity || 0);
    expect(totalCommitted).toBeLessThanOrEqual(10);
  });
});
