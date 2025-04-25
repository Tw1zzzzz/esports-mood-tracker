import axios from 'axios';
import FaceitAccount from '../models/FaceitAccount';
import Match from '../models/Match';
import User from '../models/User';
import { Types } from 'mongoose';

// Конфигурация Faceit API
const FACEIT_API_KEY = process.env.FACEIT_API_KEY || '9835c8aa-4ac2-4201-ab54-fa5a79d9f731';
const FACEIT_API_URL = 'https://open.faceit.com/data/v4';
const FACEIT_AUTH_URL = 'https://api.faceit.com/auth/v1';

// API клиент для запросов к Faceit
const faceitApiClient = axios.create({
  baseURL: FACEIT_API_URL,
  headers: {
    'Authorization': `Bearer ${FACEIT_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Инициализирует процесс OAuth авторизации
 * @param clientId - ID клиента Faceit
 * @param redirectUri - URI для перенаправления после авторизации
 * @returns URL для перенаправления пользователя
 */
export const initOAuth = (clientId: string, redirectUri: string): string => {
  if (!clientId || clientId === 'YOUR_FACEIT_CLIENT_ID') {
    throw new Error('Некорректный FACEIT_CLIENT_ID. Необходимо указать действительный идентификатор клиента FACEIT в переменных окружения.');
  }

  const scope = 'openid profile email';
  const state = Math.random().toString(36).substring(2, 15);
  
  const authUrl = `https://accounts.faceit.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  
  // Логируем URL для отладки
  console.log(`FACEIT AUTH URL: ${authUrl}`);
  
  return authUrl;
};

/**
 * Обменивает код авторизации на токены доступа
 * @param code - Код авторизации от Faceit
 * @param clientId - ID клиента Faceit
 * @param clientSecret - Секрет клиента Faceit
 * @param redirectUri - URI перенаправления
 * @returns Объект с токенами доступа
 */
export const exchangeCodeForTokens = async (
  code: string, 
  clientId: string, 
  clientSecret: string, 
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> => {
  try {
    const response = await axios.post(`${FACEIT_AUTH_URL}/token`, {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при обмене кода на токены:', error);
    throw new Error('Не удалось получить токены доступа Faceit');
  }
};

/**
 * Обновляет токен доступа с помощью refresh token
 * @param refreshToken - Refresh токен
 * @param clientId - ID клиента Faceit
 * @param clientSecret - Секрет клиента Faceit
 * @returns Новый объект с токенами доступа
 */
export const refreshAccessToken = async (
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> => {
  try {
    const response = await axios.post(`${FACEIT_AUTH_URL}/token`, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении токена доступа:', error);
    throw new Error('Не удалось обновить токен доступа Faceit');
  }
};

/**
 * Получает информацию о пользователе Faceit
 * @param accessToken - Токен доступа
 * @returns Данные пользователя Faceit
 */
export const getUserInfo = async (accessToken: string): Promise<any> => {
  try {
    const response = await axios.get(`${FACEIT_AUTH_URL}/resources/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе Faceit:', error);
    throw new Error('Не удалось получить информацию о пользователе Faceit');
  }
};

/**
 * Получает историю матчей игрока
 * @param faceitId - ID игрока на Faceit
 * @param limit - Лимит матчей (по умолчанию 20)
 * @returns Список матчей
 */
export const getPlayerMatchHistory = async (faceitId: string, limit: number = 20): Promise<any> => {
  try {
    const response = await faceitApiClient.get(`/players/${faceitId}/history`, {
      params: { limit }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении истории матчей:', error);
    throw new Error('Не удалось получить историю матчей Faceit');
  }
};

/**
 * Получает детали матча
 * @param matchId - ID матча на Faceit
 * @returns Детали матча
 */
export const getMatchDetails = async (matchId: string): Promise<any> => {
  try {
    const response = await faceitApiClient.get(`/matches/${matchId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении деталей матча:', error);
    throw new Error('Не удалось получить детали матча Faceit');
  }
};

/**
 * Получает статистику матча
 * @param matchId - ID матча на Faceit
 * @returns Статистика матча
 */
export const getMatchStats = async (matchId: string): Promise<any> => {
  try {
    const response = await faceitApiClient.get(`/matches/${matchId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статистики матча:', error);
    throw new Error('Не удалось получить статистику матча Faceit');
  }
};

/**
 * Сохраняет токены и информацию о пользователе Faceit в базу данных
 * @param userId - ID пользователя
 * @param faceitId - ID пользователя на Faceit
 * @param accessToken - Токен доступа
 * @param refreshToken - Refresh токен
 * @param expiresIn - Время жизни токена в секундах
 * @returns Созданный или обновленный документ FaceitAccount
 */
export const saveFaceitAccount = async (
  userId: string,
  faceitId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<any> => {
  try {
    // Вычисляем дату истечения токена
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);
    
    // Проверяем, существует ли уже запись об аккаунте Faceit для данного пользователя
    let faceitAccount = await FaceitAccount.findOne({ userId });
    
    if (faceitAccount) {
      // Обновляем существующую запись
      faceitAccount.faceitId = faceitId;
      faceitAccount.accessToken = accessToken;
      faceitAccount.refreshToken = refreshToken;
      faceitAccount.tokenExpiresAt = tokenExpiresAt;
      await faceitAccount.save();
    } else {
      // Создаем новую запись
      faceitAccount = await FaceitAccount.create({
        userId,
        faceitId,
        accessToken,
        refreshToken,
        tokenExpiresAt
      });
      
      // Обновляем поле faceitAccountId в модели пользователя
      await User.findByIdAndUpdate(userId, { faceitAccountId: faceitAccount._id });
    }
    
    return faceitAccount;
  } catch (error) {
    console.error('Ошибка при сохранении аккаунта Faceit:', error);
    throw new Error('Не удалось сохранить аккаунт Faceit');
  }
};

/**
 * Импортирует новые матчи пользователя
 * @param faceitAccountId - ID аккаунта Faceit
 * @returns Количество импортированных матчей
 */
export const importMatches = async (faceitAccountId: string | Types.ObjectId): Promise<number> => {
  try {
    // Получаем аккаунт Faceit
    const faceitAccount = await FaceitAccount.findById(faceitAccountId);
    if (!faceitAccount) {
      throw new Error('Аккаунт Faceit не найден');
    }
    
    // Получаем историю матчей
    const matchHistory = await getPlayerMatchHistory(faceitAccount.faceitId, 50);
    const matches = matchHistory.items || [];
    
    let importedCount = 0;
    
    // Импортируем каждый матч
    for (const matchData of matches) {
      // Проверяем, существует ли уже матч в базе
      const existingMatch = await Match.findOne({ matchId: matchData.match_id });
      
      if (!existingMatch) {
        // Получаем детали матча для дополнительной информации
        const matchDetails = await getMatchDetails(matchData.match_id);
        
        // Определяем результат матча
        let result = 'draw';
        if (matchData.results && matchData.results.length > 0) {
          const playerResult = matchData.results.find((r: any) => r.player_id === faceitAccount.faceitId);
          if (playerResult) {
            result = playerResult.outcome === 'win' ? 'win' : 'loss';
          }
        }
        
        // Создаем новую запись о матче
        await Match.create({
          faceitAccountId: faceitAccount._id,
          matchId: matchData.match_id,
          gameType: matchData.game_type || 'unknown',
          map: matchData.map || 'unknown',
          result,
          eloBefore: matchData.elo_before || 0,
          eloAfter: matchData.elo_after || 0,
          playedAt: new Date(matchData.played_at * 1000 || Date.now()),
          rawData: matchData
        });
        
        importedCount++;
      }
    }
    
    return importedCount;
  } catch (error) {
    console.error('Ошибка при импорте матчей:', error);
    throw new Error('Не удалось импортировать матчи Faceit');
  }
};

/**
 * Привязывает аккаунт Faceit к пользователю
 * @param userId - ID пользователя
 * @param faceitId - ID пользователя на Faceit
 * @param faceitNickname - Никнейм пользователя на Faceit
 * @returns Созданный или обновленный документ FaceitAccount
 */
export const connectFaceitAccount = async (
  userId: string,
  faceitId: string, 
  faceitNickname: string
): Promise<any> => {
  try {
    // Проверяем, существует ли пользователь
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Проверяем, существует ли уже привязка к аккаунту Faceit
    let faceitAccount = await FaceitAccount.findOne({ userId });
    
    if (faceitAccount) {
      // Обновляем существующую запись
      faceitAccount.faceitId = faceitId;
      await faceitAccount.save();
      
      return { message: 'Аккаунт Faceit успешно обновлен', faceitAccount };
    } else {
      // Получаем информацию о пользователе Faceit через API
      try {
        const playerData = await faceitApiClient.get(`/players/${faceitId}`);
        
        // Создаем токен с ограниченным сроком действия (1 день)
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 1);
        
        // Создаем новую запись
        faceitAccount = await FaceitAccount.create({
          userId,
          faceitId,
          accessToken: 'manual-connection',
          refreshToken: 'manual-connection',
          tokenExpiresAt
        });
        
        // Обновляем поле faceitAccountId в модели пользователя
        await User.findByIdAndUpdate(userId, { faceitAccountId: faceitAccount._id });
        
        return { 
          message: 'Аккаунт Faceit успешно привязан', 
          faceitAccount,
          playerData: playerData.data
        };
      } catch (error) {
        console.error('Ошибка при получении данных игрока Faceit:', error);
        throw new Error('Не удалось найти игрока с указанным ID на Faceit');
      }
    }
  } catch (error) {
    console.error('Ошибка при привязке аккаунта Faceit:', error);
    throw new Error('Не удалось привязать аккаунт Faceit');
  }
};

/**
 * Обрабатывает OAuth callback от Faceit
 * @param code - Код авторизации
 * @returns Объект с токеном и данными пользователя
 */
export const handleOauthCallback = async (code: string): Promise<{ token: string }> => {
  try {
    const FACEIT_CLIENT_ID = process.env.FACEIT_CLIENT_ID || 'YOUR_FACEIT_CLIENT_ID';
    const FACEIT_CLIENT_SECRET = process.env.FACEIT_CLIENT_SECRET || 'YOUR_FACEIT_CLIENT_SECRET';
    const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/api/faceit/oauth/callback';
    
    // Проверяем наличие реальных значений для OAuth
    if (FACEIT_CLIENT_ID === 'YOUR_FACEIT_CLIENT_ID' || FACEIT_CLIENT_SECRET === 'YOUR_FACEIT_CLIENT_SECRET') {
      throw new Error('Ошибка конфигурации OAuth: клиентские данные FACEIT не настроены');
    }
    
    // Обмениваем код на токены
    const tokensData = await exchangeCodeForTokens(
      code,
      FACEIT_CLIENT_ID,
      FACEIT_CLIENT_SECRET,
      REDIRECT_URI
    );
    
    // Получаем информацию о пользователе
    const userInfo = await getUserInfo(tokensData.access_token);
    
    // Для простоты возвращаем токен доступа, в реальном приложении это может быть JWT
    return { token: tokensData.access_token };
  } catch (error) {
    console.error('Ошибка при обработке OAuth callback:', error);
    throw new Error('Не удалось обработать OAuth callback');
  }
};

/**
 * Получает статистику игрока Faceit
 * @param nickname - Никнейм игрока на Faceit
 * @returns Статистика игрока
 */
export const getPlayerStats = async (nickname: string): Promise<any> => {
  try {
    // Ищем игрока по никнейму
    const playerResponse = await faceitApiClient.get('/players', {
      params: { nickname }
    });
    
    const playerId = playerResponse.data.player_id || playerResponse.data.id;
    
    if (!playerId) {
      throw new Error('Игрок не найден');
    }
    
    // Получаем статистику игрока
    const statsResponse = await faceitApiClient.get(`/players/${playerId}/stats/csgo`);
    
    return {
      player: playerResponse.data,
      stats: statsResponse.data
    };
  } catch (error) {
    console.error('Ошибка при получении статистики игрока Faceit:', error);
    throw new Error('Не удалось получить статистику игрока Faceit');
  }
};

/**
 * Получает матчи игрока Faceit
 * @param playerId - ID игрока на Faceit
 * @param limit - Лимит матчей (по умолчанию 10)
 * @param offset - Смещение (по умолчанию 0)
 * @returns Список матчей игрока
 */
export const getPlayerMatches = async (
  playerId: string,
  limit: number = 10,
  offset: number = 0
): Promise<any> => {
  try {
    // Получаем историю матчей игрока
    const matchesResponse = await faceitApiClient.get(`/players/${playerId}/history`, {
      params: { 
        limit,
        offset,
        game: 'csgo'
      }
    });
    
    const matches = matchesResponse.data.items || [];
    
    // Получаем детали каждого матча
    const matchesWithDetails = await Promise.all(
      matches.map(async (match: any) => {
        try {
          const matchDetails = await getMatchDetails(match.match_id);
          const matchStats = await getMatchStats(match.match_id);
          
          return {
            ...match,
            details: matchDetails,
            stats: matchStats
          };
        } catch (error) {
          console.error(`Ошибка при получении деталей матча ${match.match_id}:`, error);
          return match;
        }
      })
    );
    
    return {
      items: matchesWithDetails,
      total: matchesResponse.data.total || matches.length
    };
  } catch (error) {
    console.error('Ошибка при получении матчей игрока Faceit:', error);
    throw new Error('Не удалось получить матчи игрока Faceit');
  }
};

export default {
  initOAuth,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  getPlayerMatchHistory,
  getMatchDetails,
  getMatchStats,
  saveFaceitAccount,
  importMatches,
  connectFaceitAccount,
  handleOauthCallback,
  getPlayerStats,
  getPlayerMatches
}; 