import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../../../core/middleware/authenticate';

const router = Router();

router.get('/', authenticate, NotificationController.getMyNotifications);
router.get('/:id', authenticate, NotificationController.getById);
router.patch('/read-all', authenticate, NotificationController.markAllAsRead);
router.patch('/:id/read', authenticate, NotificationController.markAsRead);
router.delete('/:id', authenticate, NotificationController.deleteNotification);

export default router;
