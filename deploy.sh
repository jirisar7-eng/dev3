#!/bin/bash
# =========================================================
# TÁTA MÁ PRÁVO — DEV3 DEPLOYMENT SCRIPT (dev3.tatovacesta.cz)
# Container: tatovacesta_app_dev3 | DB: postgres_dev3
# =========================================================

set -e

REVISION=${1:-main}
echo "[DEV3 DEPLOYMENT] Starting deployment process for dev3.tatovacesta.cz using revision: $REVISION..."

# 1. Update code safely from git repository
echo "[1/6] Fetching and updating code to revision: $REVISION..."
git fetch origin || true

# Handle uncommitted changes safely (do not use git reset as blank security isolation)
if ! git diff-index --quiet HEAD --; then
  echo "[DEV3 DEPLOYMENT] Warning: Local uncommitted changes detected in workspace. Saving to stash..."
  git stash save "Dev3 deployment auto-stash for $REVISION at $(date)" || true
fi

# Checkout target revision
if git rev-parse --verify "origin/$REVISION" >/dev/null 2>&1; then
  git checkout "$REVISION" 2>/dev/null || git checkout -b "$REVISION" "origin/$REVISION" 2>/dev/null || git checkout "origin/$REVISION"
elif git rev-parse --verify "$REVISION" >/dev/null 2>&1; then
  git checkout "$REVISION"
else
  echo "[DEV3 DEPLOYMENT] ERROR: Revision '$REVISION' not found in git repository!"
  exit 1
fi

# Retrieve release details for release parity
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
RELEASE_VERSION=$(node -e "try { console.log(require('./package.json').version); } catch { console.log('0.0.0'); }" 2>/dev/null || echo "0.0.0")

echo "[DEV3 DEPLOYMENT] Building release metadata: Version $RELEASE_VERSION, SHA $GIT_SHA"

# Write release metadata file which will be copied into Docker image during build
echo "{\"version\": \"$RELEASE_VERSION\", \"gitSha\": \"$GIT_SHA\", \"dockerImage\": \"tatovacesta_app_dev3\", \"dockerImageDigest\": \"\"}" > release-metadata.json

# 2. Ensure Docker network exists
echo "[2/6] Verifying Docker network..."
export APP_NETWORK_NAME=${APP_NETWORK_NAME:-tatovacesta_app_network}
docker network create "$APP_NETWORK_NAME" 2>/dev/null || true

# 3. Build and start containers with docker compose (DEV3 explicitly uses docker-compose.yml)
echo "[3/6] Building and starting DEV3 Docker containers..."
docker compose -f docker-compose.yml up -d --build --remove-orphans

# Retrieve local built docker image digest/ID to update release parity tracking
DOCKER_IMAGE_ID=$(docker inspect --format='{{.Id}}' tatovacesta_app_dev3 2>/dev/null || echo "unknown")
echo "{\"version\": \"$RELEASE_VERSION\", \"gitSha\": \"$GIT_SHA\", \"dockerImage\": \"tatovacesta_app_dev3\", \"dockerImageDigest\": \"$DOCKER_IMAGE_ID\"}" > release-metadata.json

# 4. Validate Prisma Schema (Read-only check)
echo "[4/6] Validating Prisma schema..."
if docker exec -i tatovacesta_app_dev3 npx prisma validate; then
  echo "[DEV3 DEPLOYMENT] Prisma schema validation passed."
else
  echo "[DEV3 DEPLOYMENT] ERROR: Prisma schema validation failed!"
  exit 1
fi

# 5. Database Schema Status
echo "[5/6] Automatic schema mutations are disabled during P0 containment."
echo "[DEV3 DEPLOYMENT] No automatic migrations will be run against DEV3 DB."

# 6. Verify Health Check (Fail-closed validation)
echo "[6/6] Verifying application health..."
MAX_ATTEMPTS=15
ATTEMPT=1
HEALTH_OK=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Health check attempt $ATTEMPT/$MAX_ATTEMPTS..."
  
  # Check internal port 3000 inside container
  HEALTH_CHECK_RESP=$(docker exec -i tatovacesta_app_dev3 curl -s http://localhost:3000/api/health || echo "FAILED")
  
  if echo "$HEALTH_CHECK_RESP" | grep -q '"status":"ok"'; then
    echo "[DEV3 DEPLOYMENT] Health check passed successfully!"
    echo "Response: $HEALTH_CHECK_RESP"
    HEALTH_OK=true
    break
  fi
  
  sleep 3
  ATTEMPT=$((ATTEMPT+1))
done

if [ "$HEALTH_OK" = false ]; then
  echo "[DEV3 DEPLOYMENT] ERROR: Health check failed! Container did not return OK status."
  exit 1
fi

echo "[DEV3 DEPLOYMENT] Deployment completed successfully for dev3.tatovacesta.cz!"
