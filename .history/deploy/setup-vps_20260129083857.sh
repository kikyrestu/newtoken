#!/bin/bash
# Defense Protocol dApp - VPS Deployment Script
# Run as root or with sudo

set -e

echo "=================================="
echo "Defense Protocol - VPS Setup"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables - UPDATE THESE!
DOMAIN="your-domain.com"  # <-- CHANGE THIS
APP_DIR="/var/www/defenseprotocol"
DB_NAME="defense_db"
DB_USER="defense_user"
DB_PASS="$(openssl rand -base64 16)"

echo -e "${YELLOW}[1/8] Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
apt install -y nginx mysql-server php8.2-fpm php8.2-mysql php8.2-mbstring \
    php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd \
    nodejs npm git certbot python3-certbot-nginx unzip curl

# Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

echo -e "${YELLOW}[3/8] Creating MySQL database...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo -e "${YELLOW}[4/8] Creating app directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}[5/8] Setting up Nginx...${NC}"
cat > /etc/nginx/sites-available/defenseprotocol << 'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    
    # Frontend (React)
    root /var/www/defenseprotocol/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/defenseprotocol
ln -sf /etc/nginx/sites-available/defenseprotocol /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo -e "${YELLOW}[6/8] Installing Rust & Solana & Anchor...${NC}"
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

echo -e "${YELLOW}[7/8] Creating systemd service for Laravel...${NC}"
cat > /etc/systemd/system/defense-backend.service << 'SERVICE'
[Unit]
Description=Defense Protocol Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/defenseprotocol/backend
ExecStart=/usr/bin/php artisan serve --host=127.0.0.1 --port=8000
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable defense-backend

echo -e "${GREEN}=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "Database credentials:"
echo "  DB Name: ${DB_NAME}"
echo "  DB User: ${DB_USER}"
echo "  DB Pass: ${DB_PASS}"
echo ""
echo "Next steps:"
echo "1. Upload your code to ${APP_DIR}"
echo "2. Configure backend/.env with database credentials"
echo "3. Run: cd ${APP_DIR}/backend && composer install && php artisan migrate"
echo "4. Run: cd ${APP_DIR}/frontend && npm install && npm run build"
echo "5. Run: systemctl start defense-backend"
echo "6. For SSL: certbot --nginx -d ${DOMAIN}"
echo "==================================${NC}"
