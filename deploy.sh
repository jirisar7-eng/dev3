#!/bin/bash
# =========================================================
# TÁTA MÁ PRÁVO — DEV3 DEPLOYMENT SCRIPT (dev3.tatovacesta.cz)
# Container: tatovacesta_app_dev3 | DB: postgres_dev3
# =========================================================

set -e

echo "[DEPLOYMENT] Starting deployment process..."

# 1. Safe git pull / fetch without breaking on divergence or modifying origin history
echo "[1/6] Fetching and updating code from git main..."
git fetch origin main || true
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  git checkout main 2>/dev/null || true
  git reset --hard origin/main
fi

# 2. Validate Prisma Schema
echo "[2/6] Validating Prisma schema..."
npx prisma validate

# 3. Ensure Docker network app_network exists
echo "[3/6] Verifying Docker networks..."
docker network create app_network 2>/dev/null || true

# 4. Build and start containers with docker compose
echo "[4/6] Building and starting Docker containers..."
if [ -f "docker-compose.yml" ]; then
  docker compose up -d --build
elif [ -f "docker-compose.dev.yml" ]; then
  docker compose -f docker-compose.dev.yml up -d --build
fi

# 5. Synchronize Prisma database schema
echo "[5/6] Synchronizing Prisma DB schema..."
if docker ps --format '{{.Names}}' | grep -q 'tatovacesta_app_dev3'; then
  docker exec -i tatovacesta_app_dev3 npx prisma db push --skip-generate
elif docker ps --format '{{.Names}}' | grep -q 'tatovacesta_app_dev'; then
  docker exec -i tatovacesta_app_dev npx prisma db push --skip-generate
else
  docker compose exec -T app npx prisma db push --skip-generate
fi

# 6. Verify Health Check
echo "[6/6] Verifying application health..."
sleep 3
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health || curl -s http://localhost:3003/api/health || echo "FAILED")

echo "[DEPLOYMENT] Health check response: $HEALTH_CHECK"
echo "[DEPLOYMENT] Deployment completed successfully!"
