#!/bin/bash
# Azure App Service startup script for CiderClub Next.js standalone app.
#
# Oryx (Azure's build system) tars node_modules into node_modules.tar.gz and
# symlinks node_modules → /node_modules. Our custom startup command bypasses
# Oryx's auto-extract wrapper, so we do it manually here.
#
# Oryx may silently drop hidden directories (starting with ".") from the tar,
# which would strip the generated Prisma client at .prisma/client/. We work
# around this by keeping a non-hidden backup (prisma-client-files/) in the
# bundle and restoring it on every startup.

set -e

echo "[startup] Extracting node_modules..."
mkdir -p /node_modules
tar -xzf /home/site/wwwroot/node_modules.tar.gz -C /node_modules 2>/dev/null || true

echo "[startup] Restoring Prisma client from backup..."
if [ -d /node_modules/prisma-client-files ]; then
  mkdir -p /node_modules/.prisma/client
  cp -r /node_modules/prisma-client-files/. /node_modules/.prisma/client/

  mkdir -p /node_modules/@prisma/client/node_modules/.prisma/client
  cp -r /node_modules/prisma-client-files/. /node_modules/@prisma/client/node_modules/.prisma/client/

  echo "[startup] Prisma client restored."
else
  echo "[startup] WARNING: prisma-client-files not found in node_modules — Prisma may fail."
fi

echo "[startup] Starting Next.js server..."
exec node /home/site/wwwroot/server.js
