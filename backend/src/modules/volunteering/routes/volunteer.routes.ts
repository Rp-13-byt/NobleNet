import { Router } from 'express';
import { VolunteerController } from '../controllers/volunteer.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { UserRole } from '../../users/models/User';

const router = Router();

// Public discovery
router.get('/', VolunteerController.list);
router.get('/:id', VolunteerController.getById);

// NGO management
router.post('/', authenticate, authorize(UserRole.NGO), VolunteerController.createOpportunity);

// User applications
router.post('/:id/apply', authenticate, VolunteerController.apply);
router.get('/applications/my', authenticate, VolunteerController.myApplications);
router.get('/applications/:id', authenticate, VolunteerController.getApplicationById);
router.patch('/applications/:id/withdraw', authenticate, VolunteerController.withdraw);

// NGO application management
router.get('/ngo/applications', authenticate, authorize(UserRole.NGO), VolunteerController.ngoApplications);
router.patch('/applications/:id/approve', authenticate, authorize(UserRole.NGO), VolunteerController.approve);
router.patch('/applications/:id/reject', authenticate, authorize(UserRole.NGO), VolunteerController.reject);

export default router;
