import express from 'express';
import { protect } from '../middleware/authMiddleware';
import analyticsController from '../controllers/analyticsController';
import { AuthRequest } from '../middleware/types';

const router = express.Router();

// Применяем middleware аутентификации ко всем маршрутам
router.use(protect);

// Маршруты для получения статистики и метрик
router.get('/stats', analyticsController.getUserStats);
router.get('/metrics', analyticsController.getMetrics);
router.post('/metrics', analyticsController.saveMetrics);

// Маршруты для получения последних матчей
router.get('/matches', analyticsController.getRecentMatches);

// Маршрут для обновления кэша (доступен только для персонала)
router.post('/refresh-cache', analyticsController.refreshCache);

export default router; 