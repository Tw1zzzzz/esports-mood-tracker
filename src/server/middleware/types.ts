import { Request } from 'express';
import mongoose from 'mongoose';

// Интерфейс для доступа к данным пользователя, добавленным в req.user
export interface RequestUser {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  faceitAccountId?: string | mongoose.Types.ObjectId;
}

// Расширение типа Request для работы с пользователем
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Интерфейс для контроллеров, использующих расширенный Request
export interface AuthRequest extends Request {
  user?: any;
}

// Базовый интерфейс для запросов, которым требуется только id и faceitAccountId
export interface BaseAuthRequest extends Request {
  user: {
    id?: string;
    _id?: mongoose.Types.ObjectId;
    faceitAccountId?: string | mongoose.Types.ObjectId;
  };
} 