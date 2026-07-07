FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/analytics-service ./backend/services/analytics-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/analytics-service --omit=dev

WORKDIR /app/backend/services/analytics-service

EXPOSE 3009

CMD ["node", "src/index.js"]
