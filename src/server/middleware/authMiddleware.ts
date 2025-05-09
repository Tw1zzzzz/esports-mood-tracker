import jwt from 'jsonwebtoken';
import User from '../models/User';

// Middleware для защиты маршрутов (требует аутентификации)
export const protect = async (req: any, res: any, next: any) => {
  try {
    console.log('[AuthMiddleware] Проверка токена для запроса:', req.originalUrl);
    let token;

    // Проверяем наличие токена в заголовке Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[AuthMiddleware] Токен получен из заголовка Authorization');
    } else {
      console.log('[AuthMiddleware] Токен не найден в заголовке Authorization');
      return res.status(401).json({ message: 'Не авторизован. Токен отсутствует.' });
    }

    try {
      // Проверка токена
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as { id: string };
      console.log('[AuthMiddleware] Токен успешно проверен, ID пользователя:', decoded.id);

      // Поиск пользователя по ID из токена
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.log('[AuthMiddleware] Пользователь не найден в базе данных');
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      console.log(`[AuthMiddleware] Пользователь авторизован: ${user.name} (${user.role})`);
      
      // Добавляем пользователя в объект запроса
      req.user = user;
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Ошибка проверки токена:', error);
      return res.status(401).json({ message: 'Не авторизован. Неверный токен.' });
    }
  } catch (error) {
    console.error('[AuthMiddleware] Общая ошибка аутентификации:', error);
    return res.status(500).json({ message: 'Ошибка сервера при аутентификации' });
  }
};

// Middleware для проверки роли
export const authorize = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      console.log('[AuthMiddleware] Пользователь отсутствует в запросе');
      return res.status(401).json({ message: 'Не авторизован' });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`[AuthMiddleware] Доступ запрещен. Роль пользователя: ${req.user.role}, требуемые роли: ${roles.join(', ')}`);
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    console.log(`[AuthMiddleware] Доступ разрешен для роли: ${req.user.role}`);
    next();
  };
};

// Middleware для проверки прав администратора
export const isStaff = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'staff') {
    console.log('[Auth Middleware] Доступ сотрудника предоставлен для:', req.user._id);
    next();
  } else {
    console.log('[Auth Middleware] Доступ запрещен - требуются права сотрудника');
    return res.status(403).json({ message: 'Доступ запрещен, требуются права сотрудника' });
  }
}; 