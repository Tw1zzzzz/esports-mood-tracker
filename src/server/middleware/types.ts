import { Request } from 'express';
import mongoose from 'mongoose';

/**
 * Интерфейс для пользовательских данных
 */
export interface UserData {
  _id: string | mongoose.Types.ObjectId;
  id?: string;
  name?: string;
  role?: 'staff' | 'player';
  faceitAccountId?: string | mongoose.Types.ObjectId;
  avatar?: string;
  email?: string;
  // Другие поля пользователя
}

/**
 * Расширенный интерфейс для Express.Request с пользовательскими данными
 * для запросов требующих аутентификации
 */
export interface AuthRequest extends Request {
  user: UserData | any; // Поддерживаем любой тип данных для обратной совместимости
}

/**
 * Базовый интерфейс для запросов, требующих информацию о пользователе
 */
export interface BaseUserRequest extends Request {
  user?: UserData;
  params: {
    userId: string;
    faceitAccountId?: string;
    [key: string]: string | undefined;
  };
}

// Глобальное расширение типа Request для работы с пользователем
declare global {
  namespace Express {
    interface Request {
      user?: UserData | any;
    }
  }
}

// Базовый интерфейс для запросов, которым требуется только id и faceitAccountId
export interface BaseAuthRequest extends Request {
  user: {
    id?: string;
    _id?: mongoose.Types.ObjectId;
    faceitAccountId?: string | mongoose.Types.ObjectId;
  } | UserData | any;
} 