import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from './types';

interface JwtPayload {
  id: string;
}

/**
 * Middleware для защиты маршрутов, требующих аутентификации
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    
    // Проверяем токен в заголовке Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Проверяем токен в cookie
    else if (req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Если токен не найден, возвращаем ошибку
    if (!token) {
      console.log('[Auth] Доступ запрещен: нет токена');
      return res.status(401).json({ message: 'Нет доступа, требуется авторизация' });
    }
    
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as jwt.JwtPayload;
    
    // Получаем пользователя из базы данных по ID из токена
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('[Auth] Доступ запрещен: пользователь не найден');
      return res.status(401).json({ message: 'Пользователь не найден' });
    }
    
    // Добавляем пользователя к объекту запроса
    req.user = user;
    
    next();
  } catch (error) {
    console.error('[Auth] Ошибка аутентификации:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Недействительный токен' });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Срок действия токена истек' });
    }
    
    res.status(500).json({ 
      message: 'Ошибка аутентификации',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * Middleware для ограничения доступа по ролям
 */
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Проверяем, есть ли пользователь в запросе
    if (!req.user) {
      return res.status(401).json({ message: 'Нет доступа, требуется авторизация' });
    }
    
    // Проверяем, имеет ли пользователь необходимую роль
    if (!roles.includes(req.user.role)) {
      console.log(`[Auth] Отказано в доступе пользователю: ${req.user.email} с ролью: ${req.user.role}`);
      return res.status(403).json({ message: 'У вас нет прав для выполнения этого действия' });
    }
    
    next();
  };
};

/**
 * Middleware для проверки прав администратора
 * Должен использоваться после middleware protect
 */
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    console.log(`[AuthMiddleware] Пользователь ${req.user.name} имеет права администратора`);
    next();
  } else {
    console.log('[AuthMiddleware] Доступ запрещен, требуются права администратора');
    return res.status(403).json({ message: 'Доступ запрещен, требуются права администратора' });
  }
};

export default {
  protect,
  admin,
  restrictTo
}; 