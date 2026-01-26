# Blood Script Engine - GCP Deployment Guide

Deploy Blood Script Engine to Google Cloud Platform with the following architecture:

| Domain | Service | Platform |
|--------|---------|----------|
| api.bloodscriptengine.co.uk | NestJS API | Compute Engine |
| app.bloodscriptengine.co.uk | Companion Dashboard | Cloud Storage |
| www.bloodscriptengine.co.uk | Public Website | Cloud Storage |
| Database | PostgreSQL | Supabase |

## Prerequisites

- GCP Project with billing enabled
- `gcloud` CLI installed and authenticated
- Node.js 20+ installed locally
- Supabase project with PostgreSQL database

## Quick Start

### 1. Set Environment Variables

```bash
export GCP_PROJECT="your-gcp-project-id"
export GCE_ZONE="europe-west2-a"
export GCE_INSTANCE="bloodscript-api"
```

### 2. Create Cloud Storage Buckets

```bash
chmod +x deploy/gcp/scripts/*.sh
./deploy/gcp/scripts/setup-buckets.sh
```

### 3. Create Compute Engine VM

```bash
./deploy/gcp/scripts/setup-vm.sh
```

### 4. Configure DNS

Point these A records to the appropriate IPs:
- `api.bloodscriptengine.co.uk` → Compute Engine external IP
- `app.bloodscriptengine.co.uk` → Load Balancer IP (see below)
- `www.bloodscriptengine.co.uk` → Load Balancer IP

### 5. Create Production Environment

SSH into your VM and create the environment file:

```bash
gcloud compute ssh bloodscript-api --zone=europe-west2-a

sudo nano /opt/bloodscript/.env.production
# Copy contents from .env.production.example and fill in values
```

### 6. Deploy API

```bash
./deploy/gcp/scripts/deploy-api.sh
```

### 7. Setup SSL for API

```bash
gcloud compute ssh bloodscript-api --zone=europe-west2-a
sudo certbot --nginx -d api.bloodscriptengine.co.uk
```

### 8. Deploy Static Sites

```bash
./deploy/gcp/scripts/deploy-static.sh
```

### 9. Configure HTTPS Load Balancer

For the static sites, create an HTTPS Load Balancer in GCP Console:

1. Go to **Network Services > Load Balancing**
2. Create **HTTP(S) Load Balancer**
3. Add backend buckets:
   - `www.bloodscriptengine.co.uk` bucket
   - `app.bloodscriptengine.co.uk` bucket
4. Configure host rules:
   - `www.bloodscriptengine.co.uk` → www bucket
   - `app.bloodscriptengine.co.uk` → app bucket
5. Add SSL certificates (Google-managed recommended)
6. Note the Load Balancer IP for DNS

## File Structure

```
deploy/gcp/
├── Dockerfile                    # Container build (optional)
├── README.md                     # This file
├── .env.production.example       # Environment template
├── nginx/
│   └── api.bloodscriptengine.co.uk.conf
├── systemd/
│   └── bloodscript-api.service
└── scripts/
    ├── setup-vm.sh              # Create Compute Engine VM
    ├── setup-buckets.sh         # Create Cloud Storage buckets
    ├── build-api.sh             # Build API locally
    ├── build-static-sites.sh    # Build both static sites
    ├── deploy-api.sh            # Deploy API to VM
    └── deploy-static.sh         # Deploy static sites to buckets
```

## Environment Variables

See `.env.production.example` for full list. Required:

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Supabase PostgreSQL connection string |
| DISCORD_CLIENT_SECRET | Discord OAuth secret |
| DISCORD_BOT_TOKEN | Discord bot token |
| JWT_SECRET | JWT signing key (32+ chars) |
| GEMINI_API_KEY | Google Gemini API key |

## Updating

### Update API

```bash
./deploy/gcp/scripts/deploy-api.sh
```

### Update Static Sites

```bash
./deploy/gcp/scripts/deploy-static.sh
```

## Monitoring

### API Logs

```bash
gcloud compute ssh bloodscript-api --zone=europe-west2-a
sudo journalctl -u bloodscript-api -f
```

### Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### API not responding

```bash
sudo systemctl status bloodscript-api
sudo systemctl restart bloodscript-api
```

### SSL certificate issues

```bash
sudo certbot renew --dry-run
```

### Database connection issues

Check Supabase dashboard for connection limits and ensure the VM's IP is allowed.

## Costs (Estimated)

- **Compute Engine (e2-small)**: ~$15/month
- **Cloud Storage**: ~$0.02/GB/month
- **Load Balancer**: ~$18/month
- **SSL Certificates**: Free (Google-managed)
- **Egress**: Pay per GB transferred

Total: ~$35-50/month for low-medium traffic
