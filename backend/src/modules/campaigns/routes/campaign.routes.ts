import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { DonationController } from '../../donations/controllers/donation.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { validate } from '../../../core/middleware/validate';
import { createCampaignSchema, updateCampaignStatusSchema } from '../validations/campaign.validation';
import { UserRole } from '../../users/models/User';

const router = Router();

// Public routes
router.get('/', CampaignController.listActive);
router.get('/stats', CampaignController.getStats);
router.get('/:id', CampaignController.get);
router.get('/:id/donations', CampaignController.getSupporters);

// Donation initiation
router.post('/:campaignId/donate', authenticate, DonationController.initiate);

// NGO & Admin routes
router.post('/', authenticate, authorize(UserRole.NGO), validate(createCampaignSchema), CampaignController.create);
router.patch('/:id/status', authenticate, authorize(UserRole.NGO, UserRole.SUPER_ADMIN), validate(updateCampaignStatusSchema), CampaignController.updateStatus);

export default router;
