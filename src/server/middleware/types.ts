import { Request } from 'express';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

/**
 * Интерфейс пользователя из MongoDB
 */
export interface IUser extends Document {
  _id: string;
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

/**
 * Базовые данные пользователя для маршрутов без полной модели
 */
export interface UserData {
  _id: string;
  id: string;
}

/**
 * Расширение интерфейса запроса с пользователем для авторизованных маршрутов
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Расширение интерфейса запроса с базовой информацией о пользователе
 */
export interface BaseAuthRequest extends Request {
  user?: UserData;
}

// Для обратной совместимости
export type UserDocument = IUser;

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
  user?: {
    id?: string;
    _id?: mongoose.Types.ObjectId;
    faceitAccountId?: string | mongoose.Types.ObjectId;
  } | UserData | any;
} 