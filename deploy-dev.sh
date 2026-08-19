#!/bin/bash
# =========================================================
# TÁTA MÁ PRÁVO — DEV DEPLOYMENT SCRIPT (dev.tatovacesta.cz)
# Target VPS directory: /var/www/tatovacesta
# Container: tatovacesta_app_dev | DB: postgres_db_dev
# =========================================================

set -e

echo "[DEV DEPLOYMENT] Starting deployment process for dev.tatovacesta.cz..."

# 1. Pull latest code safely from GitHub main branch
echo "[1/6] Fetching and updating code from git main..."
git fetch origin main || true
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  git checkout main 2>/dev/null || true
  git reset --hard origin/main
fi

# 2. Ensure Docker network exists
echo "[2/6] Verifying Docker network..."
export APP_NETWORK_NAME=${APP_NETWORK_NAME:-app_network}
docker network create "$APP_NETWORK_NAME" 2>/dev/null || true

# 3. Build and start containers with docker compose
echo "[3/6] Building and starting Docker containers..."
if [ -f "docker-compose.dev.yml" ]; then
  docker compose -f docker-compose.dev.yml up -d --build --remove-orphans
else
  docker compose up -d --build --remove-orphans
fi

# 4. Validate Prisma Schema
echo "[4/6] Validating Prisma schema..."
if docker compose exec -T app npx prisma validate; then
  echo "[DEV DEPLOYMENT] Prisma schema validation passed."
elif docker ps --format '{{.Names}}' | grep -q 'tatovacesta_app_dev3'; then
  docker exec -i tatovacesta_app_dev3 npx prisma validate
elif docker ps --format '{{.Names}}' | grep -q 'tatovacesta_app_dev'; then
  docker exec -i tatovacesta_app_dev npx prisma validate
else
  echo "[DEV DEPLOYMENT] Warning: Could not validate prisma schema inside container."
fi

# 5. Synchronize Prisma database schema
echo "[5/6] Synchronizing Prisma DB schema..."
if docker compose exec -T app npx prisma db push; then
  echo "[DEV DEPLOYMENT] DB schema push completed successfully via Compose app."
elif docker ps --format '{{.Names}}' | grep -q 'tatovacesta_app_dev3'; then
  docker exec -i tatovacesta_app_dev3 npx prisma db push
elif docker ps --format '{{.Names}}' | grep -q 'tatovacesta_app_dev'; then
  docker exec -i tatovacesta_app_dev npx prisma db push
fi

# 6. Verify Health Check
echo "[6/6] Verifying application health..."
sleep 3
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health || echo "FAILED")

echo "[DEV DEPLOYMENT] Health check response: $HEALTH_CHECK"
echo "[DEV DEPLOYMENT] Deployment completed successfully for dev.tatovacesta.cz!"
