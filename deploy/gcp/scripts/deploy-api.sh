#!/bin/bash
set -e

INSTANCE="${GCE_INSTANCE:-bloodscript-api}"
ZONE="${GCE_ZONE:-europe-west2-a}"
PROJECT="${GCP_PROJECT}"

if [ -z "$PROJECT" ]; then
    echo "Error: GCP_PROJECT environment variable required"
    exit 1
fi

echo "========================================"
echo "Deploying API to Compute Engine"
echo "Instance: $INSTANCE"
echo "Zone: $ZONE"
echo "========================================"

echo "Building API..."
npm run build:backend

echo "Creating deployment archive..."
tar -czf /tmp/bloodscript-api.tar.gz \
    dist/ \
    migrations/ \
    knexfile.js \
    package.json \
    package-lock.json \
    deploy/gcp/systemd/ \
    deploy/gcp/nginx/

echo "Uploading to instance..."
gcloud compute scp /tmp/bloodscript-api.tar.gz $INSTANCE:/tmp/ --zone=$ZONE --project=$PROJECT

echo "Deploying on instance..."
gcloud compute ssh $INSTANCE --zone=$ZONE --project=$PROJECT --command='
    set -e
    
    sudo mkdir -p /opt/bloodscript
    cd /opt/bloodscript
    
    sudo tar -xzf /tmp/bloodscript-api.tar.gz
    
    if ! id "bloodscript" &>/dev/null; then
        sudo useradd -r -s /bin/false bloodscript
    fi
    sudo chown -R bloodscript:bloodscript /opt/bloodscript
    
    sudo -u bloodscript npm ci --only=production
    
    sudo cp deploy/gcp/systemd/bloodscript-api.service /etc/systemd/system/
    sudo cp deploy/gcp/nginx/api.bloodscriptengine.co.uk.conf /etc/nginx/sites-available/
    sudo ln -sf /etc/nginx/sites-available/api.bloodscriptengine.co.uk.conf /etc/nginx/sites-enabled/
    
    sudo systemctl daemon-reload
    sudo systemctl enable bloodscript-api
    sudo systemctl restart bloodscript-api
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "API deployed successfully!"
'

rm /tmp/bloodscript-api.tar.gz

echo "========================================"
echo "API Deployment Complete!"
echo "URL: https://api.bloodscriptengine.co.uk"
echo "========================================"
