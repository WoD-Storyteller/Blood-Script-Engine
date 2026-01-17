# Blood Script Engine - GCP Deployment Guide

This guide covers deploying Blood Script Engine to a GCP Compute Engine instance with separate subdomains.

## Architecture

```
bloodscriptengine.tech          → Public Website (static React)
app.bloodscriptengine.tech      → Companion Dashboard + API
app.bloodscriptengine.tech/api  → NestJS Backend (port 3000)
```

## Prerequisites

- GCP Compute Engine instance (Ubuntu 22.04 LTS recommended)
- Domain configured with DNS:
  - `A` record: `bloodscriptengine.tech` → your GCP IP
  - `A` record: `www.bloodscriptengine.tech` → your GCP IP  
  - `A` record: `app.bloodscriptengine.tech` → your GCP IP
- Ports 80 and 443 open in GCP firewall

## Quick Start

### 1. Server Setup

```bash
# SSH into your GCP instance
gcloud compute ssh YOUR_INSTANCE_NAME

# Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx git

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone Repository

```bash
sudo mkdir -p /var/www/bloodscriptengine.tech
sudo chown $USER:$USER /var/www/bloodscriptengine.tech
git clone https://github.com/YOUR_USERNAME/blood-script-engine.git /var/www/bloodscriptengine.tech
cd /var/www/bloodscriptengine.tech
```

### 3. Configure Environment

```bash
cp .env.production.example .env.production
nano .env.production
```

Required variables:
- `DISCORD_CLIENT_ID` - Your Discord app client ID
- `DISCORD_CLIENT_SECRET` - Your Discord app secret
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `SESSION_SECRET` - Generate with: `openssl rand -hex 32`
- `DATABASE_URL` - Your Supabase PostgreSQL connection string

### 4. Build Application

```bash
chmod +x deploy/scripts/*.sh
./deploy/scripts/build-production.sh
```

### 5. Install Services

```bash
# Copy nginx configs
sudo cp deploy/nginx/*.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/bloodscriptengine.tech.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/app.bloodscriptengine.tech.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Copy systemd service
sudo cp deploy/systemd/bloodscript-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable bloodscript-api
```

### 6. SSL Certificates

```bash
# Get certificates for both domains
sudo certbot --nginx -d bloodscriptengine.tech -d www.bloodscriptengine.tech
sudo certbot --nginx -d app.bloodscriptengine.tech
```

### 7. Start Services

```bash
sudo systemctl start bloodscript-api
sudo systemctl reload nginx

# Check status
sudo systemctl status bloodscript-api
sudo systemctl status nginx
```

## Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to OAuth2 → General
4. Add redirect URL: `https://app.bloodscriptengine.tech/api/auth/discord/callback`
5. Save changes

**Important:** The redirect URL in your `.env.production` must match exactly:
```
DISCORD_OAUTH_REDIRECT_URI=https://app.bloodscriptengine.tech/api/auth/discord/callback
```

The controller expects `DISCORD_OAUTH_REDIRECT_URI` (not `DISCORD_REDIRECT_URI`).

## File Structure

```
/var/www/bloodscriptengine.tech/
├── .env.production          # Environment variables
├── dist/                    # Compiled NestJS backend
├── website/dist/            # Public website static files
├── client/dist/             # Companion dashboard static files
└── deploy/
    ├── nginx/               # Nginx site configs
    ├── systemd/             # Systemd service files
    └── scripts/             # Deployment scripts
```

## Logs & Troubleshooting

```bash
# API logs
sudo journalctl -u bloodscript-api -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart services
sudo systemctl restart bloodscript-api
sudo systemctl reload nginx
```

## Updates

```bash
cd /var/www/bloodscriptengine.tech
git pull origin main
./deploy/scripts/build-production.sh
sudo systemctl restart bloodscript-api
```
