#!/bin/bash
# Deploy code to VPS
# Run from local machine

set -e

# UPDATE THESE!
VPS_IP="your-vps-ip"
VPS_USER="root"
APP_DIR="/var/www/defenseprotocol"

echo "Syncing files to VPS..."

# Sync backend (exclude vendor, node_modules, etc.)
rsync -avz --progress \
    --exclude 'vendor' \
    --exclude '.env' \
    --exclude 'storage/logs/*' \
    --exclude 'storage/framework/cache/*' \
    --exclude 'storage/framework/sessions/*' \
    --exclude 'storage/framework/views/*' \
    ../backend/ ${VPS_USER}@${VPS_IP}:${APP_DIR}/backend/

# Sync frontend (exclude node_modules, dist)
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'dist' \
    ../frontend/ ${VPS_USER}@${VPS_IP}:${APP_DIR}/frontend/

# Sync smart contract
rsync -avz --progress \
    --exclude 'target' \
    --exclude 'node_modules' \
    ../mission_lock/ ${VPS_USER}@${VPS_IP}:${APP_DIR}/mission_lock/

echo "Files synced! Now SSH to VPS and run:"
echo "  cd ${APP_DIR}/backend && composer install && php artisan migrate"
echo "  cd ${APP_DIR}/frontend && npm install && npm run build"
echo "  systemctl restart defense-backend"
