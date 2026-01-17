#!/bin/bash
set -e

# Blood Script Engine - Production Build Script
# Builds all components for deployment

echo "=========================================="
echo "Blood Script Engine - Production Build"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Building from: $ROOT_DIR"

# Build backend (NestJS)
echo ""
echo "[1/3] Building Backend API..."
npm ci
npm run build
echo "Backend build complete: dist/"

# Build public website
echo ""
echo "[2/3] Building Public Website..."
cd website
npm ci
npm run build
echo "Website build complete: website/dist/"

# Build companion app
echo ""
echo "[3/3] Building Companion Dashboard..."
cd ../client
npm ci
npm run build
echo "Companion build complete: client/dist/"

cd "$ROOT_DIR"

echo ""
echo "=========================================="
echo "All builds complete!"
echo ""
echo "Output directories:"
echo "  - Backend:   dist/"
echo "  - Website:   website/dist/"
echo "  - Companion: client/dist/"
echo "=========================================="
