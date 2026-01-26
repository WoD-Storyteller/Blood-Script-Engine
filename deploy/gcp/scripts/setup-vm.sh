#!/bin/bash
set -e

PROJECT="${GCP_PROJECT}"
ZONE="${GCE_ZONE:-europe-west2-a}"
INSTANCE="${GCE_INSTANCE:-bloodscript-api}"
MACHINE_TYPE="${GCE_MACHINE_TYPE:-e2-small}"

if [ -z "$PROJECT" ]; then
    echo "Error: GCP_PROJECT environment variable required"
    exit 1
fi

echo "========================================"
echo "Creating Compute Engine Instance"
echo "========================================"

gcloud compute instances create $INSTANCE \
    --project=$PROJECT \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
'

echo "Waiting for instance to be ready..."
sleep 30

echo "Opening firewall ports..."
gcloud compute firewall-rules create allow-http --allow tcp:80 --project=$PROJECT 2>/dev/null || true
gcloud compute firewall-rules create allow-https --allow tcp:443 --project=$PROJECT 2>/dev/null || true

IP=$(gcloud compute instances describe $INSTANCE --zone=$ZONE --project=$PROJECT --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "========================================"
echo "VM Created!"
echo ""
echo "Instance: $INSTANCE"
echo "External IP: $IP"
echo ""
echo "Next steps:"
echo "1. Point api.bloodscriptengine.co.uk A record to $IP"
echo "2. Create .env.production with secrets"
echo "3. Run: ./deploy/gcp/scripts/deploy-api.sh"
echo "4. SSH and run: sudo certbot --nginx -d api.bloodscriptengine.co.uk"
echo "========================================"
