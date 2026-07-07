FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/events-service ./backend/services/events-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/events-service --omit=dev

WORKDIR /app/backend/services/events-service

EXPOSE 3004

CMD ["node", "src/index.js"]
