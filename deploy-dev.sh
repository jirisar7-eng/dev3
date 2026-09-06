#!/bin/bash
# =========================================================
# TÁTA MÁ PRÁVO — DEV DEPLOYMENT SCRIPT (dev.tatovacesta.cz)
# Container: tatovacesta_app_dev | DB: postgres_db_dev
# =========================================================

set -e

REVISION=${1:-main}
echo "[DEV DEPLOYMENT] Starting deployment process for dev.tatovacesta.cz using revision: $REVISION..."

# 1. Update code safely from git repository
echo "[1/6] Fetching and updating code to revision: $REVISION..."
git fetch origin || true

# Handle uncommitted changes safely (do not use git reset as blank security isolation)
if ! git diff-index --quiet HEAD --; then
  echo "[DEV DEPLOYMENT] Warning: Local uncommitted changes detected in workspace. Saving to stash..."
  git stash save "Dev deployment auto-stash for $REVISION at $(date)" || true
fi

# Checkout target revision
if git rev-parse --verify "origin/$REVISION" >/dev/null 2>&1; then
  git checkout "$REVISION" 2>/dev/null || git checkout -b "$REVISION" "origin/$REVISION" 2>/dev/null || git checkout "origin/$REVISION"
elif git rev-parse --verify "$REVISION" >/dev/null 2>&1; then
  git checkout "$REVISION"
else
  echo "[DEV DEPLOYMENT] ERROR: Revision '$REVISION' not found in git repository!"
  exit 1
fi

# Retrieve release details for release parity
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
RELEASE_VERSION=$(node -e "try { console.log(require('./package.json').version); } catch { console.log('0.0.0'); }" 2>/dev/null || echo "0.0.0")

echo "[DEV DEPLOYMENT] Building release metadata: Version $RELEASE_VERSION, SHA $GIT_SHA"

# Write release metadata file which will be copied into Docker image during build
echo "{\"version\": \"$RELEASE_VERSION\", \"gitSha\": \"$GIT_SHA\", \"dockerImage\": \"tatovacesta_app_dev\", \"dockerImageDigest\": \"\"}" > release-metadata.json

# 2. Ensure Docker network exists
echo "[2/6] Verifying Docker network..."
export APP_NETWORK_NAME=${APP_NETWORK_NAME:-app_network}
docker network create "$APP_NETWORK_NAME" 2>/dev/null || true

# 3. Build and start containers with docker compose
echo "[3/6] Building and starting DEV Docker containers..."
if [ -f "docker-compose.dev.yml" ]; then
  docker compose -f docker-compose.dev.yml up -d --build --remove-orphans
else
  echo "[DEV DEPLOYMENT] ERROR: docker-compose.dev.yml not found!"
  exit 1
fi

# Retrieve local built docker image digest/ID to update release parity tracking
DOCKER_IMAGE_ID=$(docker inspect --format='{{.Id}}' tatovacesta_app_dev 2>/dev/null || echo "unknown")
echo "{\"version\": \"$RELEASE_VERSION\", \"gitSha\": \"$GIT_SHA\", \"dockerImage\": \"tatovacesta_app_dev\", \"dockerImageDigest\": \"$DOCKER_IMAGE_ID\"}" > release-metadata.json

# 4. Validate Prisma Schema (Read-only check)
echo "[4/6] Validating Prisma schema..."
if docker exec -i tatovacesta_app_dev npx prisma validate; then
  echo "[DEV DEPLOYMENT] Prisma schema validation passed."
else
  echo "[DEV DEPLOYMENT] ERROR: Prisma schema validation failed!"
  exit 1
fi

# 5. Database Schema Status
echo "[5/6] Automatic schema mutations are disabled during P0 containment."
echo "[DEV DEPLOYMENT] No automatic migrations will be run against DEV DB."

# 6. Verify Health Check (Fail-closed validation)
echo "[6/6] Verifying application health..."
MAX_ATTEMPTS=15
ATTEMPT=1
HEALTH_OK=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Health check attempt $ATTEMPT/$MAX_ATTEMPTS..."
  
  # Check internal port 3000 inside container
  HEALTH_CHECK_RESP=$(docker exec -i tatovacesta_app_dev curl -s http://localhost:3000/api/health || echo "FAILED")
  
  if echo "$HEALTH_CHECK_RESP" | grep -q '"status":"ok"'; then
    echo "[DEV DEPLOYMENT] Health check passed successfully!"
    echo "Response: $HEALTH_CHECK_RESP"
    HEALTH_OK=true
    break
  fi
  
  sleep 3
  ATTEMPT=$((ATTEMPT+1))
done

if [ "$HEALTH_OK" = false ]; then
  echo "[DEV DEPLOYMENT] ERROR: Health check failed! Container did not return OK status."
  exit 1
fi

echo "[DEV DEPLOYMENT] Deployment completed successfully for dev.tatovacesta.cz!"
