# ─────────────────────────── Estágio 1: build ───────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Instala dependências (camada cacheável)
COPY package*.json ./
RUN npm ci

# Copia o código e gera o build de produção otimizado
COPY . .
RUN npm run build

# ─────────────────────────── Estágio 2: runtime ─────────────────────────
FROM nginx:1.27-alpine AS runtime

# Config do nginx com fallback de SPA (history mode do Vue Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Artefatos estáticos do Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
