import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { UserRole } from '../../users/models/User';

const router = Router();

// NGO Dashboard
router.get('/ngo', authenticate, authorize(UserRole.NGO), DashboardController.getNgoDashboard);

// Admin Dashboard
router.get('/admin', authenticate, authorize(UserRole.SUPER_ADMIN), DashboardController.getAdminDashboard);

// User Dashboard
router.get('/user', authenticate, DashboardController.getUserDashboard);

export default router;
