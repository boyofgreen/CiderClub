#!/bin/bash
# Azure App Service startup script for CiderClub Next.js standalone app.
#
# Oryx (Azure's build system) tars node_modules into node_modules.tar.gz and
# symlinks node_modules → /node_modules. Our custom startup command bypasses
# Oryx's auto-extract wrapper, so we do it manually here.
#
# Runtime packages needed beyond Next.js standalone tracing must be explicitly
# copied in the workflow's "Assemble standalone deployment package" step so
# Oryx includes them in node_modules.tar.gz. Key packages:
#   - node_modules/prisma-generated  (Prisma client, custom output dir)
#   - node_modules/prisma            (Prisma CLI, for migrate deploy)
#   - node_modules/@prisma/engines   (native migration + query engine binaries)

set -e

echo "[startup] Extracting node_modules..."
mkdir -p /node_modules
tar -xzf /home/site/wwwroot/node_modules.tar.gz -C /node_modules 2>/dev/null || true

echo "[startup] node_modules contents after extract:"
ls /node_modules | tr '\n' ' '
echo ""

echo "[startup] Running database migrations..."
PRISMA_CLI=/node_modules/prisma/build/index.js

if [ ! -f "$PRISMA_CLI" ]; then
  echo "[startup] ERROR: Prisma CLI not found at $PRISMA_CLI"
  echo "[startup] @prisma/engines contents:"
  ls /node_modules/@prisma/engines/ 2>/dev/null || echo "  (missing)"
  echo "[startup] Skipping migrations — app may crash if schema is out of date"
else
  echo "[startup] Prisma CLI found. Running migrate deploy..."
  node "$PRISMA_CLI" migrate deploy --schema /home/site/wwwroot/prisma/schema.prisma
  echo "[startup] Migrations complete."
fi

echo "[startup] Starting Next.js server..."
exec node /home/site/wwwroot/server.js
