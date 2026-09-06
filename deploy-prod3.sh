#!/bin/bash
# =========================================================
# TÁTA MÁ PRÁVO — PROD3 DEPLOYMENT SCRIPT (tatovacesta.cz)
# Container: tatovacesta_app | DB: postgres_prod3
# =========================================================

set -e

REVISION=${1:-main}
echo "[PROD3 DEPLOYMENT] Starting production deployment process using revision/SHA: $REVISION..."

# 1. Update code safely from git repository
echo "[1/6] Fetching and updating code to target revision: $REVISION..."
git fetch origin || true

# Check for local changes (fail closed or stash, do not do hard reset as blank security)
if ! git diff-index --quiet HEAD --; then
  echo "[PROD3 DEPLOYMENT] Local uncommitted changes detected in git workspace. Saving to stash before checkout..."
  git stash save "Prod3 deployment auto-stash for $REVISION at $(date)" || true
fi

# Checkout target revision
if git rev-parse --verify "origin/$REVISION" >/dev/null 2>&1; then
  git checkout "$REVISION" 2>/dev/null || git checkout -b "$REVISION" "origin/$REVISION" 2>/dev/null || git checkout "origin/$REVISION"
elif git rev-parse --verify "$REVISION" >/dev/null 2>&1; then
  git checkout "$REVISION"
else
  echo "[PROD3 DEPLOYMENT] ERROR: Revision '$REVISION' not found in git repository!"
  exit 1
fi

# Retrieve release details for release parity
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
RELEASE_VERSION=$(node -e "try { console.log(require('./package.json').version); } catch { console.log('0.0.0'); }" 2>/dev/null || echo "0.0.0")

echo "[PROD3 DEPLOYMENT] Verified target release SHA: $GIT_SHA"
echo "[PROD3 DEPLOYMENT] Verified target version: $RELEASE_VERSION"

# Write release metadata file which will be copied into Docker image during build
echo "{\"version\": \"$RELEASE_VERSION\", \"gitSha\": \"$GIT_SHA\", \"dockerImage\": \"tatovacesta_app\", \"dockerImageDigest\": \"\"}" > release-metadata.json

# 2. Ensure Docker network exists
echo "[2/6] Verifying Docker network..."
export APP_NETWORK_NAME=${APP_NETWORK_NAME:-tatovacesta_app_network}
docker network create "$APP_NETWORK_NAME" 2>/dev/null || true

# 3. Build and start containers with docker compose (PROD3 explicitly uses docker-compose.prod.yml)
echo "[3/6] Building and starting PROD3 Docker containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Retrieve local built docker image digest/ID to update release parity tracking
DOCKER_IMAGE_ID=$(docker inspect --format='{{.Id}}' tatovacesta_app 2>/dev/null || echo "unknown")
echo "{\"version\": \"$RELEASE_VERSION\", \"gitSha\": \"$GIT_SHA\", \"dockerImage\": \"tatovacesta_app\", \"dockerImageDigest\": \"$DOCKER_IMAGE_ID\"}" > release-metadata.json

# 4. Validate Prisma Schema (Read-only check)
echo "[4/6] Validating Prisma schema inside the container..."
if docker exec -i tatovacesta_app npx prisma validate; then
  echo "[PROD3 DEPLOYMENT] Prisma schema validation passed."
else
  echo "[PROD3 DEPLOYMENT] ERROR: Prisma schema validation failed!"
  exit 1
fi

# 5. Database Schema Status
echo "[5/6] Database mutations and auto-migrations are disabled during P0 containment."
echo "[PROD3 DEPLOYMENT] All schema changes are managed via separate, controlled database workflows."

# 6. Verify Health Check (Fail-closed validation)
echo "[6/6] Verifying application health..."
MAX_ATTEMPTS=15
ATTEMPT=1
HEALTH_OK=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Health check attempt $ATTEMPT/$MAX_ATTEMPTS..."
  
  # Check internal port 3000 inside container
  HEALTH_CHECK_RESP=$(docker exec -i tatovacesta_app curl -s http://localhost:3000/api/health || echo "FAILED")
  
  if echo "$HEALTH_CHECK_RESP" | grep -q '"status":"ok"'; then
    echo "[PROD3 DEPLOYMENT] Health check passed successfully!"
    echo "Response: $HEALTH_CHECK_RESP"
    HEALTH_OK=true
    break
  fi
  
  sleep 3
  ATTEMPT=$((ATTEMPT+1))
done

if [ "$HEALTH_OK" = false ]; then
  echo "[PROD3 DEPLOYMENT] ERROR: Health check failed! Container did not return OK status."
  exit 1
fi

echo "[PROD3 DEPLOYMENT] Deployment completed successfully for PROD3!"
