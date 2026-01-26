#!/bin/bash
set -e

echo "========================================"
echo "Building Static Sites for Cloud Storage"
echo "========================================"

API_URL="${API_URL:-https://api.bloodscriptengine.co.uk}"

echo "Building Public Website (www.bloodscriptengine.co.uk)..."
cd website
npm ci
VITE_API_URL="$API_URL" npm run build
echo "Website build: website/dist/"
cd ..

echo ""
echo "Building Companion Dashboard (app.bloodscriptengine.co.uk)..."
cd client
npm ci
VITE_API_URL="$API_URL" npm run build
echo "Dashboard build: client/dist/"
cd ..

echo ""
echo "========================================"
echo "Static builds complete!"
echo ""
echo "Next: Upload to Cloud Storage buckets"
echo "  gsutil -m rsync -r -d website/dist gs://www.bloodscriptengine.co.uk"
echo "  gsutil -m rsync -r -d client/dist gs://app.bloodscriptengine.co.uk"
echo "========================================"
