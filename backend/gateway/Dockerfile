FROM node:18-alpine

WORKDIR /app

# Copiar archivos de definición de dependencias del monorepo
COPY package*.json ./

# Copiar el código del servicio
COPY backend/gateway ./backend/gateway

# Instalar dependencias usando workspaces
RUN npm install --workspace=backend/gateway --omit=dev

WORKDIR /app/backend/gateway

EXPOSE 8000

CMD ["node", "src/index.js"]
