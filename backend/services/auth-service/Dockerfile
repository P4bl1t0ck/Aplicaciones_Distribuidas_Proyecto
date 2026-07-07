FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/auth-service ./backend/services/auth-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/auth-service --omit=dev

WORKDIR /app/backend/services/auth-service

EXPOSE 3001

CMD ["node", "src/index.js"]
