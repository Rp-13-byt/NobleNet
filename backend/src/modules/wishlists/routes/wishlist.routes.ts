import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { UserRole } from '../../users/models/User';

const router = Router();

// Public
router.get('/', WishlistController.list);
router.get('/:id', WishlistController.getById);
router.get('/:wishlistId/items', WishlistController.getItems);

// NGO management
router.post('/', authenticate, authorize(UserRole.NGO), WishlistController.create);
router.post('/:wishlistId/items', authenticate, authorize(UserRole.NGO), WishlistController.addItem);

// User pledges
router.post('/items/:itemId/pledge', authenticate, WishlistController.pledge);

// User history
router.get('/my/item-donations', authenticate, WishlistController.myItemDonations);
router.post('/item-donations/:id/cancel', authenticate, WishlistController.cancelPledge);

export default router;
