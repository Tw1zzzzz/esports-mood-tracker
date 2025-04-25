import { Request } from 'express';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

/**
 * Интерфейс пользователя для базы данных
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  isAdmin: boolean;
  isStaff: boolean;
  faceitAccountId: string | null;
  completedTests: string[];
  completedBalanceWheel: boolean;
  comparePassword(password: string): Promise<boolean>;
  matchPassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Данные пользователя для токенов и ответов API
 */
export interface UserData {
  _id: mongoose.Schema.Types.ObjectId | string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  isStaff: boolean;
  faceitAccountId?: string | null;
  id?: string; // Для обратной совместимости
}

/**
 * Базовый запрос с опциональной аутентификацией
 */
export interface BaseAuthRequest extends Request {
  user?: UserData;
}

/**
 * Расширенный запрос с гарантированной аутентификацией
 * Расширяет базовый Request из Express, который может использоваться в маршрутах
 */
export interface AuthRequest extends Request {
  user: UserData;
}

/**
 * Расширенный интерфейс для аутентифицированных запросов администратора
 */
export interface AdminRequest extends Request {
  user: UserData & { isAdmin: true };
}

/**
 * Тип для ответа с токеном
 */
export interface TokenResponse {
  token: string;
  user: UserData;
}

/**
 * Статусы аутентификации
 */
export enum AuthStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  UNAUTHORIZED = 'unauthorized'
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
      user?: UserData;
    }
  }
} 