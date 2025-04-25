import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from './types';
import { UserData } from './types';

interface JwtPayload {
  id: string;
}

/**
 * Middleware для защиты маршрутов, требующих аутентификации
 */
export const protect = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    // Получение токена из заголовка
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    // Верификация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecretkey') as UserData;
    
    // Добавление информации о пользователе в запрос
    req.user = decoded;
    
    next();
    return;
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return res.status(401).json({ message: 'Ошибка аутентификации' });
  }
};

/**
 * Middleware для проверки прав администратора
 * @param req Запрос
 * @param res Ответ
 * @param next Функция перехода к следующему middleware
 */
export const admin = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    // Проверка наличия пользователя в запросе (должен быть установлен auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    // Проверка прав администратора
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
    }
    
    next();
    return;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return res.status(500).json({ message: 'Ошибка авторизации' });
  }
};

/**
 * Middleware для проверки прав сотрудника
 * @param req Запрос
 * @param res Ответ
 * @param next Функция перехода к следующему middleware
 */
export const isStaff = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    // Проверка наличия пользователя в запросе
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    // Проверка, является ли пользователь сотрудником или администратором
    if (!req.user.isStaff && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права сотрудника' });
    }
    
    next();
    return;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return res.status(500).json({ message: 'Ошибка авторизации' });
  }
};

/**
 * Middleware для ограничения доступа по ролям
 * @param roles Массив разрешенных ролей
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    // Проверка наличия пользователя
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    // Проверка роли пользователя
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Доступ запрещен. Требуются роли: ${roles.join(', ')}` 
      });
    }
    
    next();
    return;
  };
};

export default {
  protect,
  admin,
  isStaff,
  restrictTo
}; 