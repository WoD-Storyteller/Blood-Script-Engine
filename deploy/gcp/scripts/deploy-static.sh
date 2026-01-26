#!/bin/bash
set -e

PROJECT="${GCP_PROJECT}"
API_URL="${API_URL:-https://api.bloodscriptengine.co.uk}"

WEBSITE_BUCKET="www.bloodscriptengine.co.uk"
APP_BUCKET="app.bloodscriptengine.co.uk"

if [ -z "$PROJECT" ]; then
    echo "Error: GCP_PROJECT environment variable required"
    exit 1
fi

echo "========================================"
echo "Deploying Static Sites to Cloud Storage"
echo "Project: $PROJECT"
echo "========================================"

echo "Building static sites..."
API_URL="$API_URL" ./deploy/gcp/scripts/build-static-sites.sh

echo ""
echo "Uploading Public Website..."
gsutil -m rsync -r -d website/dist gs://$WEBSITE_BUCKET
gsutil web set -m index.html -e index.html gs://$WEBSITE_BUCKET
gsutil iam ch allUsers:objectViewer gs://$WEBSITE_BUCKET

echo ""
echo "Uploading Companion Dashboard..."
gsutil -m rsync -r -d client/dist gs://$APP_BUCKET
gsutil web set -m index.html -e index.html gs://$APP_BUCKET
gsutil iam ch allUsers:objectViewer gs://$APP_BUCKET

echo ""
echo "========================================"
echo "Static Deployment Complete!"
echo ""
echo "URLs (after DNS + Load Balancer setup):"
echo "  https://www.bloodscriptengine.co.uk"
echo "  https://app.bloodscriptengine.co.uk"
echo "========================================"
