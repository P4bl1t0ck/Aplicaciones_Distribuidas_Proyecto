FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar el código del servicio
COPY backend/services/broker-service ./backend/services/broker-service

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/services/broker-service --omit=dev

WORKDIR /app/backend/services/broker-service

EXPOSE 5000

CMD ["node", "src/index.js"]
