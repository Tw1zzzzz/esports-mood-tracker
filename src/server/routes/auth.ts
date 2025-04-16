import express from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Регистрация нового пользователя
router.post('/register', registerUser);

// Аутентификация пользователя
router.post('/login', loginUser);

// Получение данных текущего пользователя
router.get('/me', protect, getCurrentUser);

export default router; 