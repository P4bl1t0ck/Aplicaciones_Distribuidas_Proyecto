FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar la librería compartida
COPY backend/common ./backend/common

# Copiar el código del servicio
COPY backend/services/recommendation-service ./backend/services/recommendation-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/recommendation-service --omit=dev

WORKDIR /app/backend/services/recommendation-service

EXPOSE 3008

CMD ["node", "src/index.js"]
