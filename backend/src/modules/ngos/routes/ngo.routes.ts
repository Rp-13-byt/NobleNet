import { Router } from 'express';
import { NgoController } from '../controllers/ngo.controller';
import { CampaignController } from '../../campaigns/controllers/campaign.controller';
import { DashboardController } from '../../dashboard/controllers/dashboard.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { validate } from '../../../core/middleware/validate';
import { ngoRegistrationSchema, ngoVerificationSchema } from '../validations/ngo.validation';
import { createCampaignSchema } from '../../campaigns/validations/campaign.validation';
import { UserRole } from '../../users/models/User';
import { NGO } from '../models/NGO';
import { Campaign } from '../../campaigns/models/Campaign';

const router = Router();

// Public discovery routes
router.get('/', NgoController.list);

// NGO authenticated routes
router.get('/profile', authenticate, NgoController.getProfile);
router.patch('/profile', authenticate, authorize(UserRole.NGO), NgoController.updateProfile);
router.get('/donations', authenticate, authorize(UserRole.NGO), NgoController.getDonations);
router.get('/dashboard', authenticate, authorize(UserRole.NGO), DashboardController.getNgoDashboard);

// NGO campaign management
router.post('/campaigns', authenticate, authorize(UserRole.NGO), validate(createCampaignSchema), CampaignController.create);
router.get('/campaigns', authenticate, authorize(UserRole.NGO), async (req: any, res, next) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user.id });
    if (!ngo) return res.status(200).json({ success: true, data: [] });
    const campaigns = await Campaign.find({ ngoId: ngo._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', NgoController.getById);

// NGO registration
router.post('/register', authenticate, validate(ngoRegistrationSchema), NgoController.register);

// Admin routes for verification
router.get('/admin/pending', authenticate, authorize(UserRole.SUPER_ADMIN), NgoController.listPending);
router.patch('/:id/verify', authenticate, authorize(UserRole.SUPER_ADMIN), validate(ngoVerificationSchema), NgoController.verify);

export default router;
