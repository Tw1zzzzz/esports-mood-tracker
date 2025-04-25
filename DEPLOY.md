# Руководство по деплою на сервер Debian 12

## 1. Подготовка сервера

1. Подключение к серверу:
   ```bash
   ssh пользователь@ip-адрес
   ```

2. Обновление системы:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

3. Установка необходимых зависимостей:
   ```bash
   sudo apt install -y curl git docker.io
   ```

4. Установка Docker Compose как плагин:
   ```bash
   sudo apt install -y docker-compose-plugin
   ```

5. Настройка Docker:
   ```bash
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   ```
   (Перезайдите в систему или выполните `su - $USER` для применения изменений)

## 2. Загрузка проекта

1. Создание директории для проекта:
   ```bash
   mkdir -p ~/projects
   cd ~/projects
   ```

2. Клонирование репозитория (или копирование файлов):
   ```bash
   git clone адрес-вашего-репозитория esports-mood-tracker
   cd esports-mood-tracker
   ```

   Или если вы копируете файлы вручную:
   ```bash
   scp -r ./* пользователь@ip-адрес:~/projects/esports-mood-tracker/
   ```

## 3. Настройка переменных окружения

1. Создание файла .env:
   ```bash
   cp .env-example .env
   nano .env
   ```

2. Заполнение переменных окружения в файле .env:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=ваш_надежный_секретный_ключ
   MONGODB_URI=mongodb://mongouser:mongopassword@mongo:27017/esports-mood-tracker?authSource=admin
   ```

## 4. Запуск приложения

1. Запуск с использованием Docker Compose:
   ```bash
   docker compose up -d
   ```

2. Проверка логов:
   ```bash
   docker compose logs -f
   ```

3. Проверка состояния контейнеров:
   ```bash
   docker compose ps
   ```

## 5. Настройка Nginx (опционально для проксирования)

1. Установка Nginx:
   ```bash
   sudo apt install -y nginx
   ```

2. Создание конфигурации:
   ```bash
   sudo nano /etc/nginx/sites-available/esports-mood-tracker
   ```

3. Добавьте следующую конфигурацию:
   ```nginx
   server {
       listen 80;
       server_name ваш-домен-или-ip;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Активация конфигурации:
   ```bash
   sudo ln -s /etc/nginx/sites-available/esports-mood-tracker /etc/nginx/sites-enabled
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 6. Настройка SSL (опционально)

1. Установка Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. Получение сертификата:
   ```bash
   sudo certbot --nginx -d ваш-домен
   ```

## 7. Обслуживание

1. Перезапуск приложения:
   ```bash
   docker compose restart
   ```

2. Остановка приложения:
   ```bash
   docker compose down
   ```

3. Обновление приложения:
   ```bash
   git pull  # если используете Git
   docker compose down
   docker compose up -d --build
   ```

4. Просмотр логов:
   ```bash
   docker compose logs -f app
   ```

5. Резервное копирование базы данных:
   ```bash
   docker compose exec mongo mongodump --authenticationDatabase admin --username mongouser --password mongopassword --out /tmp/backup
   docker cp $(docker compose ps -q mongo):/tmp/backup ./backup
   ```

## 8. Безопасность

1. Настройка брандмауэра:
   ```bash
   sudo apt install -y ufw
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

2. Настройка автоматических обновлений:
   ```bash
   sudo apt install -y unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

## Устранение неполадок

1. Если команда `docker-compose` не найдена:
   ```bash
   # Используйте современный вариант команды
   docker compose up -d
   ```

2. Если ошибка "no configuration file provided":
   - Убедитесь, что вы находитесь в директории с файлом docker-compose.yml
   - Проверьте наличие файла: `ls -la | grep docker-compose.yml`

3. Если проблемы с базой данных:
   ```bash
   # Проверка логов MongoDB
   docker compose logs mongo
   ```

4. Проверка доступности API:
   ```bash
   curl http://localhost:5000/api/health
   ``` 