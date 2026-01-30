#!/bin/bash
# Defense Protocol dApp - VPS Deployment Script (GitHub Version)
# Run as root or with sudo

set -e

echo "=================================="
echo "Defense Protocol - VPS Setup"
echo "=================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ========== UPDATE THESE! ==========
DOMAIN="your-domain.com"
GITHUB_REPO="https://github.com/YOUR_USERNAME/YOUR_REPO.git"
APP_DIR="/var/www/defenseprotocol"
DB_NAME="defense_db"
DB_USER="defense_user"
DB_PASS="$(openssl rand -base64 16)"
# ===================================

echo -e "${YELLOW}[1/9] Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/9] Installing dependencies...${NC}"
apt install -y nginx mysql-server php8.2-fpm php8.2-mysql php8.2-mbstring \
    php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd \
    nodejs npm git certbot python3-certbot-nginx unzip curl

# Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

echo -e "${YELLOW}[3/9] Creating MySQL database...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo -e "${YELLOW}[4/9] Cloning from GitHub...${NC}"
mkdir -p $APP_DIR
git clone $GITHUB_REPO $APP_DIR

echo -e "${YELLOW}[5/9] Setting up Backend...${NC}"
cd $APP_DIR/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate

# Update .env
sed -i "s/DB_DATABASE=.*/DB_DATABASE=${DB_NAME}/" .env
sed -i "s/DB_USERNAME=.*/DB_USERNAME=${DB_USER}/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASS}/" .env
sed -i "s/APP_ENV=.*/APP_ENV=production/" .env
sed -i "s/APP_DEBUG=.*/APP_DEBUG=false/" .env
sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|" .env

php artisan migrate --force
php artisan config:cache
php artisan route:cache

chown -R www-data:www-data $APP_DIR/backend/storage
chown -R www-data:www-data $APP_DIR/backend/bootstrap/cache

echo -e "${YELLOW}[6/9] Setting up Frontend...${NC}"
cd $APP_DIR/frontend
npm install
echo "VITE_API_URL=https://${DOMAIN}/api" > .env.production
npm run build

echo -e "${YELLOW}[7/9] Setting up Nginx...${NC}"
cat > /etc/nginx/sites-available/defenseprotocol << NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    
    # Frontend
    root ${APP_DIR}/frontend/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy to Laravel
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/defenseprotocol /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo -e "${YELLOW}[8/9] Creating systemd service...${NC}"
cat > /etc/systemd/system/defense-backend.service << SERVICE
[Unit]
Description=Defense Protocol Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=${APP_DIR}/backend
ExecStart=/usr/bin/php artisan serve --host=127.0.0.1 --port=8000
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable defense-backend
systemctl start defense-backend

echo -e "${YELLOW}[9/9] Installing Solana & Anchor...${NC}"
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest && avm use latest

echo -e "${GREEN}=================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=================================="
echo ""
echo "Database credentials (SAVE THIS!):"
echo "  DB Name: ${DB_NAME}"
echo "  DB User: ${DB_USER}"
echo "  DB Pass: ${DB_PASS}"
echo ""
echo "Next steps:"
echo "1. Point DNS ${DOMAIN} → $(curl -s ifconfig.me)"
echo "2. Run: certbot --nginx -d ${DOMAIN}"
echo "3. To update: cd ${APP_DIR} && git pull && bash deploy/update.sh"
echo "==================================${NC}"
