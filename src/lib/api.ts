import axios from 'axios';
import ROUTES from './routes';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Добавляем таймаут для выявления проблем с подключением
  timeout: 15000
});

// Функция для обновления baseURL
export const updateApiBaseUrl = (port: number = 5000) => {
  api.defaults.baseURL = `http://localhost:${port}/api`;
};

// Оптимизированная функция для проверки доступных портов сервера
const checkServerPort = async () => {
  const ports = [5000, 5001, 5002];
  
  for (const port of ports) {
    try {
      const response = await axios.get(`http://localhost:${port}/health`, { timeout: 2000 });
      if (response.status === 200) {
        updateApiBaseUrl(port);
        return true;
      }
    } catch (error) {
      // Продолжаем проверку следующего порта
    }
  }
  
  return false;
};

// Инициализация проверки порта
checkServerPort().then(success => {
  if (!success) {
    // Повторная проверка через 5 секунд, если не удалось подключиться
    setTimeout(checkServerPort, 5000);
  }
});

// Функция для повторных попыток запроса
const retryRequest = async (fn: Function, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Ждем перед следующей попыткой
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
};

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Обработка ответов и ошибок
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response) {
    // Обработка ошибок аутентификации
    if (error.response.status === 401 && window.location.pathname !== ROUTES.WELCOME) {
      window.location.href = `${ROUTES.WELCOME}?session=expired`;
    }
  } else if (error.request) {
    // Проблема с соединением, проверяем порт
    checkServerPort();
  }
  
  return Promise.reject(error);
});

// Типы данных для API
interface BalanceWheelData {
  date: Date;
  physical: number;
  emotional: number;
  intellectual: number;
  spiritual: number;
  occupational: number;
  social: number;
  environmental: number;
  financial: number;
}

interface MoodEntryData {
  date: Date;
  timeOfDay: "morning" | "afternoon" | "evening";
  mood: number;
  energy: number;
  comment?: string;
}

interface TestEntryData {
  date: Date;
  name: string;
  link: string;
  screenshotUrl?: string;
  isWeeklyTest?: boolean;
}

interface PlayerStatusUpdate {
  completedTests?: boolean;
  completedBalanceWheel?: boolean;
}

// API для работы с игроками (для staff)
export const getPlayers = () => retryRequest(() => api.get('/users/players'));
export const getPlayerStats = (playerId: string) => retryRequest(() => api.get(`/users/players/${playerId}/stats`));
export const deletePlayer = (playerId: string) => retryRequest(() => api.delete(`/users/players/${playerId}`));
export const updatePlayerStatus = (playerId: string, status: PlayerStatusUpdate) => 
  retryRequest(() => api.patch(`/users/players/${playerId}/status`, status));

// API для работы с Колесом Баланса
export const saveBalanceWheel = (data: BalanceWheelData) => retryRequest(() => api.post('/balance-wheel', data));
export const getMyBalanceWheels = () => retryRequest(() => api.get('/balance-wheel/my'));
export const getMyLatestBalanceWheel = () => retryRequest(() => api.get('/balance-wheel/my/latest'));
export const getAllBalanceWheels = () => retryRequest(() => api.get('/balance-wheel/all'));

export const getPlayerBalanceWheels = async (playerId: string) => {
  if (!playerId) {
    throw new Error('Не указан ID игрока');
  }
  
  try {
    console.log(`[API] Запрос данных колеса баланса для игрока: ${playerId}`);
    const response = await retryRequest(() => api.get(`/balance-wheel/player/${playerId}`));
    
    // Проверяем и нормализуем формат данных
    if (response.data && typeof response.data === 'object') {
      // Если ответ в формате { data: [...] }
      if (Array.isArray(response.data.data)) {
        console.log(`[API] Получены данные колеса баланса (${response.data.data.length} записей) в формате data.data`);
        return { data: response.data.data };
      } 
      // Если ответ сам является массивом
      else if (Array.isArray(response.data)) {
        console.log(`[API] Получены данные колеса баланса (${response.data.length} записей) в формате data`);
        return { data: response.data };
      } 
      // Если ответ в другом формате - преобразуем в массив из одного элемента
      else {
        console.log(`[API] Получены данные колеса баланса в нестандартном формате, преобразуем`);
        const normalizedData = response.data.wheels || response.data.data || [response.data];
        return { data: Array.isArray(normalizedData) ? normalizedData : [normalizedData] };
      }
    }
    
    // Если данных нет или неверный формат, возвращаем пустой массив
    console.log(`[API] Получен пустой или некорректный ответ, возвращаем пустой массив`);
    return { data: [] };
  } catch (error) {
    console.error(`[API] Ошибка при получении данных колеса баланса:`, error);
    
    // В случае 4xx ошибок, пробрасываем их дальше для обработки на уровне компонента
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      throw error;
    }
    
    // В случае 5xx ошибок, возвращаем пустой массив, чтобы UI мог показать запасные данные
    return { data: [] };
  }
};

// API для работы со статистикой
export const getMoodStats = () => retryRequest(() => api.get('/stats/mood'));
export const getTestStats = () => retryRequest(() => api.get('/stats/tests'));
export const getAllPlayersMoodStats = () => retryRequest(() => api.get('/stats/players/mood'));
export const getAllPlayersTestStats = () => retryRequest(() => api.get('/stats/players/tests'));
export const getAllPlayersBalanceWheelStats = () => retryRequest(() => api.get('/stats/players/balance-wheel'));
export const getPlayerMoodChartData = (playerId: string) => 
  retryRequest(() => api.get(`/stats/players/${playerId}/mood/chart`));

// Получить агрегированные данные о настроении и энергии по дням для дашборда
export const getTeamMoodChartData = () => retryRequest(() => api.get('/stats/team/mood/chart'));

// API для работы с записями о настроении
export const createMoodEntry = (data: MoodEntryData) => retryRequest(() => api.post('/mood', data));
export const getMyMoodEntries = () => retryRequest(() => api.get('/mood/my'));
export const deleteMoodEntry = (entryId: string) => retryRequest(() => api.delete(`/mood/${entryId}`));
export const getPlayerMoodEntries = (playerId: string) => retryRequest(() => api.get(`/mood/player/${playerId}`));

// API для работы с тестами
export const createTestEntry = (data: TestEntryData) => retryRequest(() => api.post('/tests', data));
export const getMyTestEntries = () => retryRequest(() => api.get('/tests/my'));
export const deleteTestEntry = (entryId: string) => retryRequest(() => api.delete(`/tests/${entryId}`));
export const getPlayerTestEntries = (playerId: string) => retryRequest(() => api.get(`/tests/player/${playerId}`));

// Вспомогательные функции
export const getToken = () => localStorage.getItem('token');

export default api; 