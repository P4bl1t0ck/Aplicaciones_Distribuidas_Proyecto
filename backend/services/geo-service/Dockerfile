FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/geo-service ./backend/services/geo-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/geo-service --omit=dev

WORKDIR /app/backend/services/geo-service

EXPOSE 3003

CMD ["node", "src/index.js"]
