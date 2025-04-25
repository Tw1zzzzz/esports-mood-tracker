import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/types';
import bcrypt from 'bcryptjs';

// Утилита для генерации JWT токена
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  return jwt.sign({ id }, secret as jwt.Secret, {
    expiresIn,
  });
};

// Функция для установки токена в cookie
const setTokenCookie = (res: Response, token: string): void => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '30') * 24 * 60 * 60 * 1000)
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const
  };
  
  res.cookie('token', token, cookieOptions);
};

/**
 * @desc    Регистрация нового пользователя
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Проверка наличия обязательных полей
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Пожалуйста, заполните все поля' 
      });
    }

    // Проверка существования пользователя
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ 
        message: 'Пользователь с таким email уже существует' 
      });
    }

    // Создание пользователя
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      // Генерация токена
      const token = generateToken(user._id);

      // Установка cookie с токеном
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
      });

      // Отправка ответа с данными пользователя
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        token
      });
    } else {
      res.status(400).json({ message: 'Неверные данные пользователя' });
    }
  } catch (error) {
    console.error('[Auth Controller] Ошибка регистрации:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при регистрации',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * @desc    Аутентификация пользователя и получение токена
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Проверка наличия обязательных полей
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Пожалуйста, введите email и пароль' 
      });
    }

    // Поиск пользователя по email и включение пароля в результат
    const user = await User.findOne({ email }).select('+password');

    // Если пользователь не найден или пароль неверный
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Генерация токена
    const token = generateToken(user._id);

    // Установка cookie с токеном
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
    });

    // Отправка ответа с данными пользователя (без пароля)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    console.error('[Auth Controller] Ошибка входа:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при входе',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * @desc    Выход пользователя (очистка cookie)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = (req: Request, res: Response) => {
  try {
    // Очистка cookie с токеном
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.json({ message: 'Выход выполнен успешно' });
  } catch (error) {
    console.error('[Auth Controller] Ошибка выхода:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при выходе',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * @desc    Получение профиля пользователя
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Проверка наличия пользователя в запросе
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Получение и отправка данных пользователя
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isAdmin: req.user.isAdmin
    });
  } catch (error) {
    console.error('[Auth Controller] Ошибка получения профиля:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при получении профиля',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * @desc    Обновление профиля пользователя
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Проверка наличия пользователя в запросе
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Поиск пользователя для обновления
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Обновление полей
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // Обновление пароля, если он предоставлен
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Сохранение обновленного пользователя
    const updatedUser = await user.save();

    // Генерация нового токена
    const token = generateToken(updatedUser._id);

    // Установка cookie с новым токеном
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
    });

    // Отправка обновленных данных
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      token
    });
  } catch (error) {
    console.error('[Auth Controller] Ошибка обновления профиля:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при обновлении профиля',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
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