import { Router } from 'express';
import { registerEstudio, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', registerEstudio);
router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;