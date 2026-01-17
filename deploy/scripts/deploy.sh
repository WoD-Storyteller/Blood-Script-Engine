#!/bin/bash
set -e

# Blood Script Engine - GCP Deployment Script
# Run as: sudo ./deploy.sh

APP_DIR="/var/www/bloodscriptengine.tech"
REPO_URL="https://github.com/YOUR_USERNAME/blood-script-engine.git"
BRANCH="main"

echo "=========================================="
echo "Blood Script Engine - Production Deploy"
echo "=========================================="

# Create application user if not exists
if ! id "bloodscript" &>/dev/null; then
    echo "Creating bloodscript user..."
    sudo useradd -r -s /bin/false bloodscript
fi

# Create app directory
sudo mkdir -p $APP_DIR
sudo chown bloodscript:bloodscript $APP_DIR

# Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Clone/update repository
if [ -d "$APP_DIR/.git" ]; then
    echo "Updating repository..."
    cd $APP_DIR
    sudo -u bloodscript git fetch origin
    sudo -u bloodscript git reset --hard origin/$BRANCH
else
    echo "Cloning repository..."
    sudo -u bloodscript git clone -b $BRANCH $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Install dependencies
echo "Installing dependencies..."
sudo -u bloodscript npm ci --production=false

# Build backend
echo "Building backend..."
sudo -u bloodscript npm run build

# Build public website
echo "Building public website..."
cd $APP_DIR/website
sudo -u bloodscript npm ci
sudo -u bloodscript npm run build

# Build companion app
echo "Building companion app..."
cd $APP_DIR/client
sudo -u bloodscript npm ci
sudo -u bloodscript npm run build

# Copy systemd service
echo "Installing systemd service..."
sudo cp $APP_DIR/deploy/systemd/bloodscript-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable bloodscript-api

# Copy nginx configs
echo "Installing nginx configs..."
sudo cp $APP_DIR/deploy/nginx/*.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/bloodscriptengine.tech.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/app.bloodscriptengine.tech.conf /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart services
echo "Restarting services..."
sudo systemctl restart bloodscript-api
sudo systemctl reload nginx

echo "=========================================="
echo "Deployment complete!"
echo ""
echo "Subdomains configured:"
echo "  - https://bloodscriptengine.tech (public website)"
echo "  - https://app.bloodscriptengine.tech (companion + API)"
echo ""
echo "Next steps:"
echo "  1. Copy .env.production.example to .env.production"
echo "  2. Fill in all required values"
echo "  3. Run: sudo certbot --nginx -d bloodscriptengine.tech -d www.bloodscriptengine.tech"
echo "  4. Run: sudo certbot --nginx -d app.bloodscriptengine.tech"
echo "  5. Restart: sudo systemctl restart bloodscript-api"
echo "=========================================="
