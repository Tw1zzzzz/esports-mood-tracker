import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Маршруты для аутентификации
 * @route /api/auth
 */

// Публичные маршруты
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Защищенные маршруты (требуется аутентификация)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router; 