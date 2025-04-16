import axios from "axios";

// Задаем базовый URL для API
const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

/**
 * Универсальная функция для обработки ошибок API
 * @param error - Объект ошибки от axios
 * @param defaultMessage - Сообщение по умолчанию, если ошибка не имеет стандартного формата
 * @returns Сообщение об ошибке в читаемом формате
 */
export const handleApiError = (error: any, defaultMessage: string): string => {
  console.error('[API] Ошибка:', error);
  
  if (!error.response) {
    return error.request ? 'Сервер не отвечает' : defaultMessage;
  }
  
  if (error.response.data?.message) {
    return error.response.data.message;
  }
  
  // Обработка типовых статус-кодов
  switch (error.response.status) {
    case 400: return 'Некорректные данные';
    case 401: return 'Неверные учетные данные';
    case 403: return 'Доступ запрещен';
    case 409: return 'Пользователь с таким email уже существует';
    case 404: return 'Ресурс не найден';
    case 500: return 'Внутренняя ошибка сервера';
    default: return defaultMessage;
  }
};

/**
 * Функция для выполнения авторизованных запросов к API
 * @param method - HTTP метод запроса
 * @param endpoint - Конечная точка API (без базового URL и /api)
 * @param data - Данные для отправки (для POST, PUT)
 * @returns Промис с данными ответа, типизированный с помощью generic параметра T
 */
export const makeAuthRequest = async <T,>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: any
): Promise<T> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    url: `${baseUrl}/api${endpoint}`,
    headers,
    data,
    timeout: 10000
  };
  
  const response = await axios(config);
  return response.data;
};

/**
 * Функция для выполнения запросов к API без авторизации
 * @param method - HTTP метод запроса 
 * @param endpoint - Конечная точка API (без базового URL и /api)
 * @param data - Данные для отправки (для POST, PUT)
 * @returns Промис с данными ответа, типизированный с помощью generic параметра T
 */
export const makeApiRequest = async <T,>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: any
): Promise<T> => {
  const config = {
    method,
    url: `${baseUrl}/api${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    },
    data,
    timeout: 10000
  };
  
  const response = await axios(config);
  return response.data;
}; 