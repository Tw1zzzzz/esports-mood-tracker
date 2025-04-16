import jwt from 'jsonwebtoken';
import User from '../models/User';

// Middleware для защиты маршрутов
export const protect = async (req: any, res: any, next: any) => {
  let token;

  console.log(`[AUTH] Проверка авторизации для ${req.method} ${req.originalUrl}`);
  console.log(`[AUTH] Заголовки:`, req.headers.authorization ? 'Bearer token присутствует' : 'Заголовок авторизации отсутствует');

  // Проверяем наличие токена в заголовке Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1];
      console.log(`[AUTH] Токен получен, проверяю...`);

      // Верифицируем токен
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log(`[AUTH] Токен действителен, ID пользователя:`, decoded.id);

      // Получаем пользователя из базы, исключая пароль
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log(`[AUTH] Пользователь с ID ${decoded.id} не найден в базе`);
        return res.status(401).json({ message: 'Пользователь не найден' });
      }
      
      console.log(`[AUTH] Пользователь ${req.user.name} (${req.user.role}) авторизован`);
      next();
    } catch (error) {
      console.error('[AUTH] Ошибка проверки токена:', error);
      return res.status(401).json({ message: 'Недействительный токен' });
    }
  } else {
    console.log('[AUTH] Токен не предоставлен');
    
    // Для отладки: проверка, есть ли запрос от тестового фронтенда без авторизации
    if (process.env.NODE_ENV === 'development' || req.query.debug === 'true') {
      console.log('[AUTH] Режим разработки: временно разрешаю доступ без токена');
      
      // Ищем тестового пользователя с ролью staff
      const testStaff = await User.findOne({ role: 'staff' }).select('-password');
      
      if (testStaff) {
        console.log(`[AUTH] Используем тестового пользователя: ${testStaff.name}`);
        req.user = testStaff;
        return next();
      }
    }
    
    return res.status(401).json({ message: 'Не авторизован, токен отсутствует' });
  }
};

// Middleware для проверки роли Staff
export const isStaff = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'staff') {
    console.log(`[AUTH] Доступ для сотрудника (${req.user.name}) разрешен`);
    next();
  } else {
    console.log(`[AUTH] Доступ запрещен: требуется роль 'staff'`);
    return res.status(403).json({ message: 'Нет прав доступа для этого действия' });
  }
};

// Middleware для проверки роли Player
export const isPlayer = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'player') {
    console.log(`[AUTH] Доступ для игрока (${req.user.name}) разрешен`);
    next();
  } else {
    console.log(`[AUTH] Доступ запрещен: требуется роль 'player'`);
    return res.status(403).json({ message: 'Нет прав доступа для этого действия' });
  }
}; 