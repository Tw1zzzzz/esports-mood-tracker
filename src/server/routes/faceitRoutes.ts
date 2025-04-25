import express from 'express';
import faceitController from '../controllers/faceitController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Маршруты для Faceit OAuth
router.get('/oauth/init', protect, faceitController.initOAuth);
router.get('/oauth/callback', protect, faceitController.oauthCallback);

// Маршруты для импорта матчей и проверки статуса
router.post('/import-matches', protect, faceitController.importMatches);
router.get('/status', protect, faceitController.checkFaceitStatus);

// Маршруты для работы с Faceit API
router.post('/connect', protect, faceitController.connectFaceitAccount);
router.get('/player/:nickname', faceitController.getPlayerStats);
router.get('/matches/:playerId', faceitController.getPlayerMatches);

export default router; 