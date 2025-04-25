import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest, UserData } from '../middleware/types';
import bcrypt from 'bcryptjs';

// HTTP статус коды
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Генерация JWT токена для пользователя
 */
const generateToken = (user: UserData): string => {
  return jwt.sign(
    { 
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      isStaff: user.isStaff,
      faceitAccountId: user.faceitAccountId
    },
    process.env.JWT_SECRET || 'defaultsecretkey',
    { expiresIn: '30d' }
  );
};

/**
 * Регистрация нового пользователя
 * @route POST /api/auth/register
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Проверка, существует ли уже пользователь
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создание нового пользователя
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
      isAdmin: false,
      isStaff: false
    });

    if (user) {
      // Формирование данных пользователя для токена
      const userData: UserData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        isStaff: user.isStaff,
        faceitAccountId: user.faceitAccountId
      };

      // Возвращаем успешный ответ с токеном
      return res.status(HTTP_STATUS_CODES.CREATED).json({
        success: true,
        token: generateToken(userData),
        user: userData
      });
    } else {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Невозможно создать пользователя'
      });
    }
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Ошибка при регистрации пользователя',
      error: (error as Error).message
    });
  }
};

/**
 * Аутентификация пользователя
 * @route POST /api/auth/login
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Проверка наличия email и пароля
    if (!email || !password) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Пожалуйста, введите email и пароль'
      });
    }

    // Поиск пользователя в базе
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Проверка пароля
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Формирование данных пользователя для токена
    const userData: UserData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      isStaff: user.isStaff,
      faceitAccountId: user.faceitAccountId
    };

    // Возвращаем успешный ответ с токеном
    return res.status(HTTP_STATUS_CODES.OK).json({
      success: true,
      token: generateToken(userData),
      user: userData
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Ошибка при аутентификации',
      error: (error as Error).message
    });
  }
};

/**
 * Выход пользователя (инвалидация токена)
 * @route POST /api/auth/logout
 */
export const logoutUser = async (req: Request, res: Response) => {
  try {
    // В JWT аутентификации выход обычно реализуется на стороне клиента
    // путем удаления токена. Здесь просто возвращаем успешный ответ.
    return res.status(HTTP_STATUS_CODES.OK).json({
      success: true,
      message: 'Выход выполнен успешно'
    });
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Ошибка при выходе из системы',
      error: (error as Error).message
    });
  }
};

/**
 * Получение профиля пользователя
 * @route GET /api/auth/profile
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    return res.status(HTTP_STATUS_CODES.OK).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Ошибка при получении профиля пользователя',
      error: (error as Error).message
    });
  }
};

/**
 * Обновление профиля пользователя
 * @route PUT /api/auth/profile
 */
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Обновляем только те поля, которые были предоставлены
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Обновляем пароль только если он был предоставлен
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Формируем данные пользователя для ответа
    const userData: UserData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      isStaff: updatedUser.isStaff,
      faceitAccountId: updatedUser.faceitAccountId
    };

    return res.status(HTTP_STATUS_CODES.OK).json({
      success: true,
      token: generateToken(userData),
      user: userData
    });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Ошибка при обновлении профиля пользователя',
      error: (error as Error).message
    });
  }
};

// Экспорт всех методов как объекта
export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser
}; 