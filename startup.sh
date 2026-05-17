#!/bin/bash
# Azure App Service startup script for CiderClub Next.js standalone app.
#
# Oryx (Azure's build system) tars node_modules into node_modules.tar.gz and
# symlinks node_modules → /node_modules. Our custom startup command bypasses
# Oryx's auto-extract wrapper, so we do it manually here.
#
# The Prisma client is in node_modules/prisma-generated/ (non-hidden), so
# Oryx will always include it in the tar — no extra restore step needed.

set -e

echo "[startup] Extracting node_modules..."
mkdir -p /node_modules
tar -xzf /home/site/wwwroot/node_modules.tar.gz -C /node_modules 2>/dev/null || true

echo "[startup] Running database migrations..."
node /node_modules/prisma/build/index.js migrate deploy --schema /home/site/wwwroot/prisma/schema.prisma

echo "[startup] Starting Next.js server..."
exec node /home/site/wwwroot/server.js
