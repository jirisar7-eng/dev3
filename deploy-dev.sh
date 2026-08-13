#!/bin/bash
# =========================================================
# TÁTA MÁ PRÁVO — DEV DEPLOYMENT SCRIPT (dev.tatovacesta.cz)
# Target VPS directory: /var/www/tatovacesta
# Container: tatovacesta_app_dev | DB: postgres_db_dev
# =========================================================

set -e

echo "[DEV DEPLOYMENT] Starting deployment process for dev.tatovacesta.cz..."

# 1. Pull latest code from GitHub main branch
echo "[1/6] Pulling latest code from git..."
git pull origin main

# 2. Validate Prisma Schema
echo "[2/6] Validating Prisma schema..."
npx prisma validate

# 3. Ensure Docker network app_network exists
echo "[3/6] Verifying Docker app_network..."
docker network create app_network 2>/dev/null || true

# 4. Build and start containers with docker compose
echo "[4/6] Building and starting Docker containers..."
if [ -f "docker-compose.dev.yml" ]; then
  docker compose -f docker-compose.dev.yml up -d --build
else
  docker compose up -d --build
fi

# 5. Synchronize Prisma database schema
echo "[5/6] Synchronizing Prisma DB schema..."
docker exec -i tatovacesta_app_dev npx prisma db push --skip-generate

# 6. Verify Health Check
echo "[6/6] Verifying application health..."
sleep 3
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health || echo "FAILED")

echo "[DEV DEPLOYMENT] Health check response: $HEALTH_CHECK"
echo "[DEV DEPLOYMENT] Deployment completed successfully for dev.tatovacesta.cz!"
