import { Router } from 'express';
import { ImpactController } from '../controllers/impact.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { UserRole } from '../../users/models/User';

const router = Router();

router.get('/ngo/:ngoId', ImpactController.getByNgo);
router.post('/', authenticate, authorize(UserRole.NGO), ImpactController.create);
router.patch('/:id', authenticate, authorize(UserRole.NGO), ImpactController.update);
router.delete('/:id', authenticate, authorize(UserRole.NGO), ImpactController.delete);

export default router;
