FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_ vars sono baked al build time — passarle come ARG
ARG VITE_ENABLE_WITH_OPERATION_FILTER=false
ENV VITE_ENABLE_WITH_OPERATION_FILTER=$VITE_ENABLE_WITH_OPERATION_FILTER
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
