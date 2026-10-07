import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../../../core/middleware/validate';
import { registerSchema, loginSchema, refreshSchema } from '../validations/auth.validation';
import { authenticate } from '../../../core/middleware/authenticate';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.get('/me', authenticate, AuthController.me);

export default router;
