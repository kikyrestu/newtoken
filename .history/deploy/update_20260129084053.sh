#!/bin/bash
# Quick update script - run on VPS after git pull
set -e

APP_DIR="/var/www/defenseprotocol"

echo "Updating backend..."
cd $APP_DIR/backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache

echo "Updating frontend..."
cd $APP_DIR/frontend
npm install
npm run build

echo "Restarting service..."
systemctl restart defense-backend

echo "✅ Update complete!"
