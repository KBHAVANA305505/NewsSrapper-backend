import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.post('/me/save/:articleId', authenticate, authController.saveArticle);
router.post('/me/history/:articleId', authenticate, authController.addToHistory);

export default router;