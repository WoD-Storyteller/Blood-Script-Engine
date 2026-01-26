#!/bin/bash
set -e

echo "Building Blood Script Engine API..."

npm ci
npm run build:backend

echo "API build complete!"
echo "Output: dist/"
