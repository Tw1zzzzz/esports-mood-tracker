import express from 'express';
import { protect } from '../middleware/authMiddleware';
import authController from '../controllers/authController';

const router = express.Router();

// Маршруты, не требующие аутентификации
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Маршруты, требующие аутентификации
router.use(protect);
router.get('/me', authController.getUserProfile);
router.put('/me', authController.updateUserProfile);
router.post('/logout', authController.logoutUser);

export default router; 