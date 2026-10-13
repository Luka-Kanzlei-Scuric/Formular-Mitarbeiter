FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY index.html vite.config.js postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
ARG VITE_BACKEND_URL=
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv/formular
COPY deploy/hetzner/Caddyfile /etc/caddy/Caddyfile
