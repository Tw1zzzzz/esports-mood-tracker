import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// Маршруты API
import authRoutes from './routes/auth';
import balanceWheelRoutes from './routes/balanceWheel';
import userRoutes from './routes/users';
import moodRoutes from './routes/mood';
import testsRoutes from './routes/tests';
import statsRoutes from './routes/stats';
import healthRoutes from './health';

// Загрузка переменных окружения
dotenv.config();

// Инициализация приложения
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Диагностический middleware для логирования запросов и ответов
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 10);
  
  console.log(`🔍 [${requestId}] ${req.method} ${req.url} - начало запроса`);
  
  // Сохраняем оригинальный метод end
  const originalEnd = res.end;
  
  // Переопределяем метод end для логирования ответа
  // @ts-ignore - Игнорируем предупреждения о неиспользуемых параметрах, они нужны для совместимости с типами
  res.end = function(
    _chunk?: any,
    _encoding?: BufferEncoding | (() => void),
    _callback?: (() => void)
  ): any {
    const duration = Date.now() - start;
    console.log(`✅ [${requestId}] ${req.method} ${req.url} - статус ${res.statusCode} (${duration}ms)`);
    
    // Вызываем оригинальный метод end с оригинальными аргументами
    return originalEnd.apply(this, arguments);
  };
  
  next();
});

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esports-mood-tracker')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// API Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/balance-wheel', balanceWheelRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/health', healthRoutes);

// Обработка ошибки 404 для маршрутов API
app.use('/api/*', (req, res) => {
  console.log(`404 для API маршрута: ${req.originalUrl}`);
  res.status(404).json({ 
    status: 'error', 
    message: 'API endpoint не найден', 
    path: req.originalUrl 
  });
});

// Маршрут для проверки здоровья сервера (базовая версия)
app.get('/health-check', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обслуживание статических файлов в production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });
}

// Экспортируем приложение для использования в других файлах
export default app; 