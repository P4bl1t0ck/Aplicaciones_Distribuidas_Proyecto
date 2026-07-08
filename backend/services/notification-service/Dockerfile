FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/notification-service ./backend/services/notification-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/notification-service --omit=dev

WORKDIR /app/backend/services/notification-service

EXPOSE 3007

CMD ["node", "src/index.js"]
