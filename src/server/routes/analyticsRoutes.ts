import express from 'express';
import analyticsController from '../controllers/analyticsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Маршруты для получения статистики и метрик
router.get('/stats', protect, analyticsController.getUserStats);
router.get('/metrics', protect, analyticsController.getMetrics);
router.post('/metrics', protect, analyticsController.saveMetrics);

// Маршруты для получения последних матчей
router.get('/matches', protect, analyticsController.getRecentMatches);

// Маршрут для обновления кэша (доступен только для персонала)
router.post('/refresh-cache', protect, analyticsController.refreshCache);

export default router; 