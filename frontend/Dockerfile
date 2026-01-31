# =============================================================================
# MISSION LAUNCHPAD - FRONTEND DOCKERFILE
# React/Vite build -> Nginx static serve
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Install build dependencies for native modules (usb, etc)
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev

WORKDIR /app

# Copy package files (only package.json, not lockfile)
COPY package.json ./

# Install dependencies (force to bypass platform checks)
RUN npm install --legacy-peer-deps --force

# Copy source code
COPY . .

# Copy production env
COPY .env.production .env

# Build for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
