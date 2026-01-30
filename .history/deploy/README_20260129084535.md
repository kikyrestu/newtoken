# Docker Deployment Guide

## Quick Start

### 1. Create environment file
```bash
cp .env.docker.example .env
nano .env  # Update passwords and domain
```

### 2. Build & Run
```bash
docker-compose up -d --build
```

### 3. Run migrations
```bash
docker exec defense-backend php artisan migrate --force
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VPS / Server                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Frontend   │  │   Backend    │  │  MySQL    │ │
│  │  (Nginx)     │  │  (Laravel)   │  │  (DB)     │ │
│  │  Port 80     │  │  Port 8000   │  │  3306     │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│         │                  │               │        │
│         └──────────────────┴───────────────┘        │
│                    docker network                   │
└─────────────────────────────────────────────────────┘
```

---

## Commands

| Action | Command |
|--------|---------|
| Start all | `docker-compose up -d` |
| Stop all | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Backend logs | `docker logs defense-backend -f` |
| Rebuild | `docker-compose up -d --build` |
| Shell into backend | `docker exec -it defense-backend bash` |
| Run migrations | `docker exec defense-backend php artisan migrate` |

---

## VPS Setup (First Time)

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone & Deploy
```bash
git clone https://github.com/YOUR_USERNAME/defense-protocol.git
cd defense-protocol
cp .env.docker.example .env
nano .env  # Edit values
docker-compose up -d --build
```

---

## SSL with Traefik (Optional)

For production SSL, uncomment and configure the nginx/traefik service in `docker-compose.yml`, or use Cloudflare proxy.

---

## Update Deployment

```bash
cd /path/to/defense-protocol
git pull origin main
docker-compose up -d --build
docker exec defense-backend php artisan migrate --force
```
