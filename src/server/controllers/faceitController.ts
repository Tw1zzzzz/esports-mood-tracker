import { Request, Response } from 'express';
import faceitService from '../services/faceitService';
import { AuthRequest } from '../middleware/types';

// Константы для конфигурации OAuth
const FACEIT_CLIENT_ID = process.env.FACEIT_CLIENT_ID || 'YOUR_FACEIT_CLIENT_ID';
const FACEIT_CLIENT_SECRET = process.env.FACEIT_CLIENT_SECRET || 'YOUR_FACEIT_CLIENT_SECRET';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/api/faceit/oauth/callback';

/**
 * Инициализация OAuth процесса
 * @route GET /api/faceit/oauth/init
 */
export const initOAuth = (req: Request, res: Response) => {
  try {
    // Проверяем наличие реальных значений для OAuth
    if (FACEIT_CLIENT_ID === 'YOUR_FACEIT_CLIENT_ID' || FACEIT_CLIENT_SECRET === 'YOUR_FACEIT_CLIENT_SECRET') {
      return res.status(400).json({ 
        message: 'Ошибка конфигурации OAuth: клиентские данные FACEIT не настроены',
        error: 'Необходимо указать FACEIT_CLIENT_ID и FACEIT_CLIENT_SECRET в переменных окружения'
      });
    }
    
    // Получаем URL для редиректа на авторизацию Faceit
    const authorizationUrl = faceitService.initOAuth(FACEIT_CLIENT_ID, REDIRECT_URI);
    
    // Возвращаем URL для редиректа
    return res.json({ url: authorizationUrl });
  } catch (error) {
    console.error('Ошибка при инициализации OAuth:', error);
    return res.status(500).json({ message: 'Не удалось инициализировать OAuth' });
  }
};

/**
 * Обработка callback от Faceit OAuth
 * @route GET /api/faceit/oauth/callback
 */
export const oauthCallback = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Отсутствует код авторизации' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }
    
    // Проверяем наличие реальных значений для OAuth
    if (FACEIT_CLIENT_ID === 'YOUR_FACEIT_CLIENT_ID' || FACEIT_CLIENT_SECRET === 'YOUR_FACEIT_CLIENT_SECRET') {
      return res.status(400).json({ 
        message: 'Ошибка конфигурации OAuth: клиентские данные FACEIT не настроены',
        error: 'Необходимо указать FACEIT_CLIENT_ID и FACEIT_CLIENT_SECRET в переменных окружения'
      });
    }
    
    // Обмениваем код на токены
    const tokensData = await faceitService.exchangeCodeForTokens(
      code as string,
      FACEIT_CLIENT_ID,
      FACEIT_CLIENT_SECRET,
      REDIRECT_URI
    );
    
    // Получаем информацию о пользователе Faceit
    const userInfo = await faceitService.getUserInfo(tokensData.access_token);
    
    // Сохраняем информацию об аккаунте Faceit
    const faceitAccount = await faceitService.saveFaceitAccount(
      req.user.id as string,
      userInfo.guid,
      tokensData.access_token,
      tokensData.refresh_token,
      tokensData.expires_in
    );
    
    // Запускаем импорт матчей в фоновом режиме
    faceitService.importMatches(faceitAccount._id)
      .then(count => console.log(`Импортировано ${count} матчей`))
      .catch(err => console.error('Ошибка при импорте матчей:', err));
    
    // Перенаправляем на страницу аналитики
    return res.redirect('/analytics');
  } catch (error) {
    console.error('Ошибка при обработке callback OAuth:', error);
    return res.status(500).json({ message: 'Не удалось обработать ответ OAuth' });
  }
};

/**
 * Импорт матчей пользователя
 * @route POST /api/faceit/import-matches
 */
export const importMatches = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }
    
    // Проверяем наличие аккаунта Faceit у пользователя
    if (!req.user.faceitAccountId) {
      return res.status(400).json({ message: 'Аккаунт Faceit не привязан' });
    }
    
    // Импортируем матчи
    const importedCount = await faceitService.importMatches(req.user.faceitAccountId);
    
    return res.json({ message: `Импортировано ${importedCount} матчей` });
  } catch (error) {
    console.error('Ошибка при импорте матчей:', error);
    return res.status(500).json({ message: 'Не удалось импортировать матчи' });
  }
};

/**
 * Проверка статуса подключения аккаунта Faceit
 * @route GET /api/faceit/status
 */
export const checkFaceitStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }
    
    const isConnected = Boolean(req.user.faceitAccountId);
    
    return res.json({ connected: isConnected });
  } catch (error) {
    console.error('Ошибка при проверке статуса Faceit:', error);
    return res.status(500).json({ message: 'Не удалось проверить статус Faceit' });
  }
};

/**
 * Привязка аккаунта Faceit к пользователю
 * @route POST /api/faceit/connect
 */
export const connectFaceitAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }
    
    const { faceitId, faceitNickname } = req.body;
    
    if (!faceitId || !faceitNickname) {
      return res.status(400).json({ message: 'Требуется указать идентификатор и никнейм Faceit' });
    }
    
    // Привязка аккаунта Faceit
    const result = await faceitService.connectFaceitAccount(req.user.id as string, faceitId, faceitNickname);
    
    return res.json(result);
  } catch (error) {
    console.error('Ошибка при привязке аккаунта Faceit:', error);
    return res.status(500).json({ message: 'Не удалось привязать аккаунт Faceit' });
  }
};

/**
 * Поиск статистики игрока Faceit
 * @route GET /api/faceit/player/:nickname
 */
export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    const { nickname } = req.params;
    
    if (!nickname) {
      return res.status(400).json({ message: 'Необходимо указать никнейм игрока' });
    }
    
    // Получение статистики игрока Faceit
    const playerStats = await faceitService.getPlayerStats(nickname);
    
    return res.json(playerStats);
  } catch (error) {
    console.error('Ошибка при получении статистики игрока Faceit:', error);
    return res.status(500).json({ message: 'Не удалось получить статистику игрока' });
  }
};

/**
 * Получение матчей игрока Faceit
 * @route GET /api/faceit/matches/:playerId
 */
export const getPlayerMatches = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { limit, offset } = req.query;
    
    if (!playerId) {
      return res.status(400).json({ message: 'Необходимо указать ID игрока' });
    }
    
    // Получение матчей игрока Faceit
    const matches = await faceitService.getPlayerMatches(
      playerId,
      Number(limit) || 10,
      Number(offset) || 0
    );
    
    return res.json(matches);
  } catch (error) {
    console.error('Ошибка при получении матчей игрока Faceit:', error);
    return res.status(500).json({ message: 'Не удалось получить матчи игрока' });
  }
};

export default {
  initOAuth,
  oauthCallback,
  importMatches,
  checkFaceitStatus,
  connectFaceitAccount,
  getPlayerStats,
  getPlayerMatches
}; 