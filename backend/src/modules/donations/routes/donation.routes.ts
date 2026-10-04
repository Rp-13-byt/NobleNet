import { Router } from 'express';
import { DonationController } from '../controllers/donation.controller';
import { authenticate } from '../../../core/middleware/authenticate';

const router = Router();

router.post('/', authenticate, DonationController.initiate);
router.post('/initiate', authenticate, DonationController.initiate);
router.post('/verify', authenticate, DonationController.verify);
router.get('/my', authenticate, DonationController.myDonations);
router.get('/:id/status', authenticate, DonationController.getStatus);
router.get('/:id/receipt', authenticate, DonationController.getReceipt);
router.get('/:id', authenticate, DonationController.getById);

export default router;
