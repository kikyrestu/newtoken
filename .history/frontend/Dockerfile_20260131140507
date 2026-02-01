# =============================================================================
# MISSION LAUNCHPAD - FRONTEND DOCKERFILE
# React/Vite build -> Nginx static serve
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (only package.json, not lockfile)
COPY package.json ./

# Install dependencies fresh for Linux platform
RUN npm install --legacy-peer-deps

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
