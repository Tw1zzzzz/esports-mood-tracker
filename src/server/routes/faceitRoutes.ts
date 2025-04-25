import express from 'express';
import { protect } from '../middleware/authMiddleware';
import faceitController from '../controllers/faceitController';

const router = express.Router();

// Инициализация OAuth Faceit
router.get('/oauth/init', faceitController.initOAuth);

// Callback для OAuth Faceit
router.get('/oauth/callback', faceitController.oauthCallback);

// Маршруты, требующие аутентификации
router.use(protect);

// Проверка статуса подключения аккаунта Faceit
router.get('/status', faceitController.checkFaceitStatus);

// Подключение аккаунта Faceit к пользователю
router.post('/connect', faceitController.connectFaceitAccount);

// Импорт матчей пользователя
router.post('/import-matches', faceitController.importMatches);

// Поиск статистики игрока Faceit
router.get('/player/:nickname', faceitController.getPlayerStats);

// Получение матчей игрока Faceit
router.get('/matches/:playerId', faceitController.getPlayerMatches);

// Связывание аккаунта Faceit с пользователем
router.post('/link-account', faceitController.linkFaceitAccount);

// Отсоединение аккаунта Faceit от пользователя
router.post('/unlink-account', faceitController.unlinkFaceitAccount);

// Проверка статуса связывания аккаунта
router.get('/link-status', faceitController.checkLinkStatus);

// Обновление данных профиля
router.post('/update-profile', faceitController.updateFaceitProfile);

export default router; 