FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/reward-service ./backend/services/reward-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/reward-service --omit=dev

WORKDIR /app/backend/services/reward-service

EXPOSE 3006

CMD ["node", "src/index.js"]
