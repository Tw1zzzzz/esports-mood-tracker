// Импортируем app из server.ts
import app from './server';
import mongoose from 'mongoose';

// Определяем порт
const PORT = process.env.PORT || 5000;

// Запускаем сервер при установлении подключения к MongoDB
mongoose.connection.once('open', () => {
  console.log('✅ MongoDB подключение установлено успешно');
  console.log(`🗄️ Подключено к базе данных: ${mongoose.connection.name}`);
  
  // Проверяем доступность коллекций
  mongoose.connection.db.listCollections().toArray()
    .then(collections => {
      console.log('📊 Доступные коллекции:', collections.map(c => c.name).join(', '));
    })
    .catch(err => {
      console.error('❌ Ошибка при получении списка коллекций:', err);
    });
});

// Слушаем ошибки подключения к MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Ошибка подключения к MongoDB:', err.message);
});

// Слушаем отключения от MongoDB
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Отключено от MongoDB');
});

// Обработка необработанных исключений
process.on('uncaughtException', (err) => {
  console.error('❌ Необработанное исключение:', err.message);
  console.error(err.stack);
});

// Обработка необработанных отклонений Promise
process.on('unhandledRejection', (reason, _promise) => {
  console.error('❌ Необработанное отклонение Promise:', reason);
});

// Функция для проверки доступности порта
const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise(resolve => {
    const server = require('net').createServer()
      .once('error', () => {
        resolve(false);
      })
      .once('listening', () => {
        server.close();
        resolve(true);
      })
      .listen(port);
  });
};

// Поиск свободного порта в диапазоне
const findAvailablePort = async (startPort: number, endPort: number = startPort + 10): Promise<number> => {
  for (let port = startPort; port <= endPort; port++) {
    const isAvailable = await isPortAvailable(port);
    if (isAvailable) {
      return port;
    }
  }
  throw new Error(`Не удалось найти свободный порт в диапазоне ${startPort}-${endPort}`);
};

// Запускаем сервер
const startServer = async () => {
  try {
    // Ищем свободный порт, начиная с 5000
    const availablePort = await findAvailablePort(Number(PORT));
    console.log(`Найден свободный порт: ${availablePort}`);
    
    // Обновляем порт в process.env для доступа из других модулей
    process.env.PORT = String(availablePort);
    
    const server = app.listen(availablePort, () => {
      console.log(`🚀 Сервер запущен на порту: ${availablePort}`);
      console.log(`🌐 Режим: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 JWT секрет: ${process.env.JWT_SECRET ? 'настроен' : 'не настроен - используется значение по умолчанию'}`);
      console.log(`📡 Адрес API: http://localhost:${availablePort}/api`);
      console.log(`🩺 Адрес проверки состояния: http://localhost:${availablePort}/health`);
    });

    // Обработка сигналов завершения
    process.on('SIGTERM', () => {
      console.log('SIGTERM получен, закрываем сервер');
      server.close(() => {
        console.log('Сервер закрыт');
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT получен, закрываем сервер');
      server.close(() => {
        console.log('Сервер закрыт');
      });
    });

    return server;
  } catch (error) {
    console.error('Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запускаем сервер
startServer(); 