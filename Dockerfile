FROM node:20-alpine AS server-build

WORKDIR /app
# Копируем только файлы сервера
COPY src/server/package*.json ./server/
RUN cd server && npm install --no-fund --no-audit

# Копируем исходники сервера
COPY src/server ./server
# Собираем сервер
RUN cd server && npm run build

# Создаем финальный образ
FROM node:20-alpine

WORKDIR /app

# Копируем собранные файлы сервера
COPY --from=server-build /app/server/dist ./server/dist
COPY src/server/package*.json ./server/

# Устанавливаем только production зависимости
RUN cd server && npm install --omit=dev --no-fund --no-audit

# Создаем необходимые директории
RUN mkdir -p ./uploads
RUN mkdir -p ./server/dist/public

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

# Запускаем сервер
CMD ["node", "server/dist/index.js"]