import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest, BaseAuthRequest, UserData } from './types';

/**
 * Middleware для проверки JWT токена и аутентификации пользователя
 * @param req Запрос
 * @param res Ответ
 * @param next Следующий обработчик
 */
export const protect = async (req: BaseAuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    let token;

    // Проверка наличия токена в заголовке или куках
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Получение токена из заголовка
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Получение токена из cookie
      token = req.cookies.token;
    }

    // Если токен не найден
    if (!token) {
      return res.status(401).json({ message: 'Не авторизован, токен отсутствует' });
    }

    try {
      // Верификация токена
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'defaultsecretkey'
      ) as UserData;

      // Поиск пользователя по ID из токена
      const user = await User.findById(decoded._id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      // Добавление пользователя в запрос
      req.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        isStaff: user.isStaff,
        faceitAccountId: user.faceitAccountId,
        id: user._id.toString() // Для обратной совместимости
      };
      
      next();
      return;
    } catch (error) {
      console.error('[Auth Middleware] Ошибка верификации токена:', error);
      return res.status(401).json({ message: 'Не авторизован, недействительный токен' });
    }
  } catch (error) {
    console.error('[Auth Middleware] Ошибка в защитном middleware:', error);
    return res.status(500).json({ 
      message: 'Внутренняя ошибка сервера',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * Middleware для проверки роли пользователя
 * @param roles Массив разрешенных ролей
 */
export const authorize = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    try {
      // Проверка наличия пользователя
      if (!req.user) {
        return res.status(401).json({ message: 'Не авторизован' });
      }

      // Если роли не указаны, разрешаем доступ всем аутентифицированным пользователям
      if (roles.length === 0) {
        next();
        return;
      }

      // Проверка роли пользователя
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Доступ запрещен, недостаточно прав' 
        });
      }

      next();
      return;
    } catch (error) {
      console.error('[Auth Middleware] Ошибка в middleware авторизации:', error);
      return res.status(500).json({ 
        message: 'Внутренняя ошибка сервера',
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  };
};

/**
 * Middleware для базовой авторизации без доступа к модели User
 * Используется для маршрутов, которым не требуется полная модель пользователя
 */
export const basicAuth = async (req: BaseAuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    let token;

    // Проверка наличия токена в заголовке или куках
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Если токен не найден
    if (!token) {
      return res.status(401).json({ message: 'Не авторизован, токен отсутствует' });
    }

    try {
      // Верификация токена
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'defaultsecretkey'
      ) as UserData;

      // Добавление пользователя в запрос
      req.user = decoded;
      next();
      return;
    } catch (error) {
      console.error('[Auth Middleware] Ошибка верификации токена:', error);
      return res.status(401).json({ message: 'Не авторизован, недействительный токен' });
    }
  } catch (error) {
    console.error('[Auth Middleware] Ошибка в базовом middleware авторизации:', error);
    return res.status(500).json({ 
      message: 'Внутренняя ошибка сервера',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * Middleware для проверки прав администратора
 * @param req Запрос
 * @param res Ответ
 * @param next Следующий обработчик
 */
export const admin = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  if (!req.user) {
    return res.status(401).json({ message: 'Не авторизован' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Доступ запрещен, требуются права администратора' 
    });
  }
  
  next();
  return;
};

/**
 * Middleware для проверки прав стаффа (персонала)
 * @param req Запрос Express с добавленным полем user
 * @param res Ответ Express
 * @param next Функция для перехода к следующему middleware
 */
export const staff = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  if (req.user && (req.user.isAdmin || req.user.isStaff)) {
    next();
    return;
  } else {
    return res.status(403).json({ message: 'Нет доступа, требуются права сотрудника' });
  }
};

/**
 * Middleware для проверки прав сотрудника
 * @param req Запрос
 * @param res Ответ
 * @param next Следующий обработчик
 */
export const isStaff = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  if (req.user && req.user.isStaff) {
    console.log('[Auth Middleware] Доступ сотрудника предоставлен для:', req.user._id);
    next();
    return;
  } else {
    console.log('[Auth Middleware] Доступ запрещен - требуются права сотрудника');
    return res.status(403).json({ message: 'Доступ запрещен, требуются права сотрудника' });
  }
}; 