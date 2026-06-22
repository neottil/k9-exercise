FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_ vars sono baked al build time — passarle come ARG
ARG VITE_ENABLE_WITH_OPERATION_FILTER=false
ENV VITE_ENABLE_WITH_OPERATION_FILTER=$VITE_ENABLE_WITH_OPERATION_FILTER
ARG VITE_LOGIN_TYPE=token
ENV VITE_LOGIN_TYPE=$VITE_LOGIN_TYPE
ARG VITE_LOGIN_SITE_URL=http://localhost:3000
ENV VITE_LOGIN_SITE_URL=$VITE_LOGIN_SITE_URL

RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
