FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/user-service ./backend/services/user-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/user-service --omit=dev

WORKDIR /app/backend/services/user-service

EXPOSE 3002

CMD ["node", "src/index.js"]
