import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { PaymentController } from '../../payments/controllers/payment.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { UserRole } from '../../users/models/User';

const router = Router();

// All routes here are restricted to SUPER_ADMIN
router.use(authenticate, authorize(UserRole.SUPER_ADMIN));

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/ngos/pending', AdminController.getPendingNgos);
router.get('/ngos', AdminController.getNgos);
router.patch('/ngos/:id/review', AdminController.reviewNgo);
router.get('/campaigns', AdminController.getCampaigns);
router.patch('/campaigns/:id/moderate', AdminController.moderateCampaign);
router.get('/donations', AdminController.getDonations);
router.get('/audit-logs', AdminController.getAuditLogs);
router.post('/payments/:paymentId/refund', PaymentController.refund);

export default router;
