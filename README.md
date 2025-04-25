# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c9f8034d-b680-4012-8ee1-33e7a2bc97bb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c9f8034d-b680-4012-8ee1-33e7a2bc97bb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## React DevTools

Проект настроен для работы с React DevTools в отдельном приложении. Для использования:

1. Запустите сервер React DevTools с помощью команды:
   ```sh
   npm run dev:react-devtools
   ```

2. В отдельном терминале запустите приложение стандартным способом:
   ```sh
   npm run dev
   ```

3. React DevTools автоматически подключится к вашему приложению через скрипт в index.html. Окно React DevTools отобразит иерархию компонентов вашего приложения.

4. Если у вас возникают проблемы с подключением:
   - Убедитесь, что сервер React DevTools запущен и работает на порту 8097
   - Проверьте, что в index.html присутствует строка `<script src="http://localhost:8097"></script>`
   - Перезагрузите страницу приложения
   - Проверьте версии пакетов: `npm list react-devtools-core`

## How can I deploy this project?

### Деплой на Vercel с MongoDB Atlas

Для деплоя вашего проекта на Vercel с интеграцией MongoDB Atlas, следуйте этой инструкции:

#### 1. Подготовка MongoDB Atlas

1. Создайте бесплатный аккаунт на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Создайте новый кластер (можно использовать бесплатный тариф M0)
3. В разделе "Database Access" создайте нового пользователя с правами readWrite
4. В разделе "Network Access" добавьте IP-адрес 0.0.0.0/0 (разрешить доступ отовсюду)
5. В разделе "Databases" нажмите "Connect" и выберите "Connect your application"
6. Скопируйте строку подключения, она будет выглядеть примерно так:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/esports-mood-tracker?retryWrites=true&w=majority
   ```
7. Замените `<username>`, `<password>` и `<cluster>` вашими данными

#### 2. Подготовка репозитория для Vercel

1. Убедитесь, что вы отправили все изменения в ваш Git-репозиторий:
   ```sh
   git add .
   git commit -m "Подготовка к деплою на Vercel"
   git push
   ```

#### 3. Деплой на Vercel

1. Зарегистрируйтесь или войдите на [Vercel](https://vercel.com/)
2. Нажмите "Add New" -> "Project"
3. Импортируйте ваш Git-репозиторий
4. В настройках проекта добавьте переменные окружения:
   - `MONGODB_URI` = скопированная строка подключения MongoDB Atlas
   - `JWT_SECRET` = ваш секретный ключ (можно сгенерировать случайную строку)
   - Добавьте другие необходимые переменные окружения из `.env-example`
5. Нажмите "Deploy"
6. После успешного деплоя вы получите URL вашего приложения

#### 4. Проверка и мониторинг

1. Проверьте работу вашего приложения по предоставленному Vercel URL
2. В панели управления Vercel вы можете просматривать логи, настраивать домены и управлять деплоями
3. В MongoDB Atlas вы можете мониторить использование базы данных и производительность

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
