FROM node:22-bookworm-slim

# Dependencias de sistema necesarias para better-sqlite3 (compilación nativa)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar deps
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código
COPY . .

# Build de Next.js
RUN npm run build

# Crear directorios persistentes (volúmenes en EasyPanel)
RUN mkdir -p /app/auth /app/data

EXPOSE 3000

# Arranca bot + web a la vez
CMD ["npm", "run", "start:all"]
