import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlist.service';

export class WishlistController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const wishlist = await WishlistService.createWishlist(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Wishlist created', data: wishlist });
    } catch (e) { next(e); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const wishlists = await WishlistService.getWishlists(req.query.ngoId as string | undefined);
      res.json({ success: true, data: wishlists });
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const wishlist = await WishlistService.getWishlistById(req.params.id as string);
      res.json({ success: true, data: wishlist });
    } catch (e) { next(e); }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await WishlistService.addItem(req.user!.id, req.params.wishlistId as string, req.body);
      res.status(201).json({ success: true, message: 'Item added', data: item });
    } catch (e) { next(e); }
  }

  static async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await WishlistService.getItemsByWishlist(req.params.wishlistId as string);
      res.json({ success: true, data: items });
    } catch (e) { next(e); }
  }

  static async pledge(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WishlistService.pledgeItem(req.user!.id, req.params.itemId as string, req.body.quantity);
      res.status(201).json({ success: true, message: 'Pledge successful', data: result });
    } catch (e) { next(e); }
  }

  static async myItemDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const donations = await WishlistService.getUserItemDonations(req.user!.id);
      res.json({ success: true, data: donations });
    } catch (e) { next(e); }
  }

  static async cancelPledge(req: Request, res: Response, next: NextFunction) {
    try {
      const pledge = await WishlistService.cancelPledge(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Pledge cancelled', data: pledge });
    } catch (e) { next(e); }
  }
}
