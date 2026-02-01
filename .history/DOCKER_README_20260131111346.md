# 🚀 Mission Launchpad - Docker Deployment Guide

## Quick Start

### 1. Setup Environment Variables

```bash
# Copy the docker env file
cp .env.docker .env

# Edit with your passwords
nano .env
```

### 2. Update Production Configs

**Backend** (`backend/.env.production`):
- Set `TOKEN_MINT_ADDRESS` - dari Vanja
- Set `TREASURY_WALLET_ADDRESS` - dari Vanja
- Set `SOLANA_PROGRAM_ID` - setelah smart contract deploy

**Frontend** (`frontend/.env.production`):
- Set `VITE_TOKEN_MINT` - sama dengan backend
- Set `VITE_TREASURY_WALLET` - sama dengan backend
- Set `VITE_API_URL` - URL backend production

### 3. Build and Run

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 4. First-time Setup

```bash
# Generate Laravel app key
docker-compose exec backend php artisan key:generate

# Run migrations
docker-compose exec backend php artisan migrate

# Optimize for production
docker-compose exec backend php artisan optimize
docker-compose exec backend php artisan config:cache
docker-compose exec backend php artisan route:cache
```

---

## Container Ports

| Container | Port | URL |
|-----------|------|-----|
| Frontend | 80/443 | http://localhost |
| Backend | 8000 | http://localhost:8000 |
| MySQL | 3306 | mysql://localhost:3306 |
| phpMyAdmin | 8080 | http://localhost:8080 |

---

## Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Enter container shell
docker-compose exec backend sh
docker-compose exec mysql mysql -u mission_user -p

# Stop all
docker-compose down

# Stop and remove volumes (CAREFUL - deletes data!)
docker-compose down -v
```

---

## Production Checklist

- [ ] Set strong passwords in `.env`
- [ ] Update `TOKEN_MINT_ADDRESS` from Vanja
- [ ] Update `TREASURY_WALLET_ADDRESS` from Vanja
- [ ] Update `VITE_API_URL` to production domain
- [ ] Configure SSL/HTTPS (add certs to nginx)
- [ ] Set `APP_DEBUG=false`
- [ ] Run `php artisan optimize`
- [ ] Test lock transaction

---

## Troubleshooting

### Backend 502 Bad Gateway
```bash
docker-compose logs backend
docker-compose restart backend
```

### Database Connection Failed
```bash
# Wait for MySQL to be ready
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# Check migrations
docker-compose exec backend php artisan migrate:status
```

### Frontend Not Loading
```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```
