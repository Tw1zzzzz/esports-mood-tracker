FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install --no-fund --no-audit
COPY . .
RUN npm run build
RUN npm run server:build

FROM node:20-alpine as production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/server/dist ./server/dist
COPY package*.json ./
COPY src/server/package*.json ./server/
RUN npm install --omit=dev --no-fund --no-audit
RUN cd server && npm install --omit=dev --no-fund --no-audit

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/dist/index.js"]