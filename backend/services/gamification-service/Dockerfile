FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/gamification-service ./backend/services/gamification-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/gamification-service --omit=dev

WORKDIR /app/backend/services/gamification-service

EXPOSE 3005

CMD ["node", "src/index.js"]
