import express from 'express';
import { protect } from '../middleware/authMiddleware';
import authController from '../controllers/authController';

const router = express.Router();

// Маршруты, не требующие аутентификации
router.post('/register', authController.register);
router.post('/login', authController.login);

// Маршруты, требующие аутентификации
router.use(protect);
router.get('/me', authController.getUserProfile);
router.put('/me', authController.updateUserProfile);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export default router; 