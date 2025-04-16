import jwt from 'jsonwebtoken';
import User from '../models/User';

// Генерация JWT токена
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

// Регистрация нового пользователя
export const registerUser = async (req: any, res: any) => {
  try {
    console.log('[AuthController] Запрос на регистрацию:', {
      email: req.body.email,
      name: req.body.name,
      role: req.body.role
    });
    
    const { name, email, password, role = 'player' } = req.body;
    
    // Проверка существования пользователя
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`[AuthController] Пользователь с email ${email} уже существует`);
      return res.status(409).json({ 
        message: 'Пользователь с таким email уже существует' 
      });
    }
    
    // Создание пользователя
    const user = await User.create({
      name,
      email,
      password,
      role
    });
    
    if (user) {
      console.log(`[AuthController] Пользователь создан успешно:`, {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
      
      // Генерация JWT токена
      const token = generateToken(user._id.toString());
      
      res.status(201).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } else {
      console.log('[AuthController] Ошибка: не удалось создать пользователя');
      return res.status(400).json({ message: 'Неверные данные пользователя' });
    }
  } catch (error) {
    console.error('[AuthController] Ошибка регистрации:', error);
    return res.status(500).json({ 
      message: 'Ошибка при регистрации пользователя',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Аутентификация пользователя
export const loginUser = async (req: any, res: any) => {
  try {
    console.log('[AuthController] Запрос на вход:', { email: req.body.email });
    
    const { email, password } = req.body;
    
    // Проверка на наличие email и пароля
    if (!email || !password) {
      console.log('[AuthController] Ошибка: отсутствует email или пароль');
      return res.status(400).json({ message: 'Необходимо указать email и пароль' });
    }
    
    // Поиск пользователя по email с явным включением пароля
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`[AuthController] Ошибка: пользователь с email ${email} не найден`);
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    // Проверка пароля
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log(`[AuthController] Ошибка: неверный пароль для пользователя ${email}`);
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    console.log(`[AuthController] Успешный вход пользователя:`, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Генерация JWT токена
    const token = generateToken(user._id.toString());
    
    // Возвращаем данные пользователя (без пароля)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    };
    
    res.json({
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('[AuthController] Ошибка входа:', error);
    return res.status(500).json({ 
      message: 'Ошибка сервера при входе',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Получение данных текущего пользователя
export const getCurrentUser = async (req: any, res: any) => {
  try {
    console.log('[AuthController] Запрос данных текущего пользователя');
    // Пользователь уже должен быть в req.user из middleware защиты маршрута
    const user = req.user;
    
    if (!user) {
      console.log('[AuthController] Ошибка: информация о пользователе не найдена');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    console.log(`[AuthController] Пользователь найден: ${user.name} (${user._id})`);
    res.json(user);
  } catch (error) {
    console.error('[AuthController] Ошибка при получении данных текущего пользователя:', error);
    return res.status(500).json({ 
      message: 'Ошибка сервера при получении данных пользователя',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
}; 