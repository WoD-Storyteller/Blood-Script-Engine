#!/bin/bash
set -e

PROJECT="${GCP_PROJECT}"
REGION="${GCP_REGION:-europe-west2}"

WEBSITE_BUCKET="www.bloodscriptengine.co.uk"
APP_BUCKET="app.bloodscriptengine.co.uk"

if [ -z "$PROJECT" ]; then
    echo "Error: GCP_PROJECT environment variable required"
    exit 1
fi

echo "========================================"
echo "Setting up Cloud Storage Buckets"
echo "========================================"

for BUCKET in $WEBSITE_BUCKET $APP_BUCKET; do
    echo "Creating bucket: $BUCKET"
    
    gsutil mb -p $PROJECT -l $REGION -b on gs://$BUCKET 2>/dev/null || echo "Bucket exists"
    
    gsutil web set -m index.html -e index.html gs://$BUCKET
    
    gsutil iam ch allUsers:objectViewer gs://$BUCKET
    
    echo "Bucket $BUCKET configured for static hosting"
done

echo ""
echo "========================================"
echo "Buckets Created!"
echo ""
echo "Next steps:"
echo "1. Create HTTPS Load Balancer in GCP Console"
echo "2. Add backend buckets for each domain"
echo "3. Configure SSL certificates (managed or custom)"
echo "4. Point DNS A records to Load Balancer IP"
echo "========================================"
