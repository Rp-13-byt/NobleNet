import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate } from '../../../core/middleware/authenticate';

const router = Router();

router.get('/ngo/:ngoId', ReviewController.getByNgo);
router.post('/ngo/:ngoId', authenticate, ReviewController.create);
router.patch('/:id', authenticate, ReviewController.update);
router.delete('/:id', authenticate, ReviewController.delete);

export default router;
