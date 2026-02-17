# Artium - Full Stack Deployment Guide

## Overview
This guide documents the complete deployment process for the Artium AI Article Creator, including backend deployment to Azure VPS with Docker + GitHub Actions, and frontend deployment to Cloudflare Pages with a custom domain.

---

## Table of Contents
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Domain Configuration](#domain-configuration)
- [Problems & Solutions](#problems--solutions)
- [Final Architecture](#final-architecture)

---

## Backend Deployment

### Prerequisites
- Azure VPS (Ubuntu) - IP: 20.24.66.144
- Docker Hub account (username: shalinshah07)
- GitHub repository
- MongoDB Atlas cluster

### Step 1: Create Dockerfile

Created `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Create Docker Compose

Created `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - MONGODB_DB=${MONGODB_DB}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS}
    depends_on:
      - mongodb
    networks:
      - artium-network

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - artium-network

volumes:
  mongodb_data:

networks:
  artium-network:
    driver: bridge
```

### Step 3: GitHub Actions CI/CD Pipeline

Created `.github/workflows/backend-ci-cd.yml`:

```yaml
name: Backend CI/CD

on:
  push:
    branches:
      - main
      - master
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci-cd.yml'

env:
  DOCKER_IMAGE: shalinshah07/artium-backend
  REGISTRY: docker.io

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ env.DOCKER_IMAGE }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to Azure VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          script: |
            cd /opt/artium
            docker pull ${{ env.DOCKER_IMAGE }}:latest
            docker stop artium-backend || true
            docker rm artium-backend || true
            docker run -d \
              --name artium-backend \
              --restart unless-stopped \
              -p 8000:8000 \
              -e MONGODB_URI="${{ secrets.MONGODB_URI }}" \
              -e MONGODB_DB="${{ secrets.MONGODB_DB }}" \
              -e GEMINI_API_KEY="${{ secrets.GEMINI_API_KEY }}" \
              -e JWT_SECRET="${{ secrets.JWT_SECRET }}" \
              -e CORS_ORIGINS="${{ secrets.CORS_ORIGINS }}" \
              ${{ env.DOCKER_IMAGE }}:latest
            docker image prune -af --filter "until=24h"
```

### Step 4: Configure GitHub Secrets

Added the following secrets in GitHub repository settings:

1. **DOCKER_USERNAME**: `shalinshah07`
2. **DOCKER_TOKEN**: Docker Hub access token
3. **VPS_HOST**: `20.24.66.144`
4. **VPS_USERNAME**: `azureuser`
5. **VPS_SSH_KEY**: Private SSH key generated on VPS
6. **VPS_DEPLOY_PATH**: `/opt/artium`
7. **MONGODB_URI**: `mongodb+srv://vps_admin:PASSWORD@artium-vps-backend.hux3b9m.mongodb.net/ai_article_creator?retryWrites=true&w=majority&appName=Artium-vps-backend`
8. **MONGODB_DB**: `ai_article_creator`
9. **GEMINI_API_KEY**: Google Gemini API key
10. **JWT_SECRET**: Random secure string
11. **CORS_ORIGINS**: `https://artiumm.tech,https://artium.pages.dev`

### Step 5: SSH Key Setup on VPS

```bash
# On VPS
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# Display private key and add to GitHub secrets as VPS_SSH_KEY
cat ~/.ssh/github_actions

# Add public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 6: Install Nginx as Reverse Proxy

Nginx is required because Cloudflare expects the origin server on port 80 (HTTP) when using "Flexible" SSL mode.

```bash
# Create nginx config script
cat > /tmp/nginx-setup.sh << 'EOF'
#!/bin/bash
sudo apt-get update
sudo apt-get install -y nginx

sudo tee /etc/nginx/sites-available/artium-api > /dev/null <<'INNER_EOF'
server {
    listen 80;
    server_name api.artiumm.tech;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
INNER_EOF

sudo ln -sf /etc/nginx/sites-available/artium-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
EOF

# Run the script
chmod +x /tmp/nginx-setup.sh
sudo /tmp/nginx-setup.sh
```

### Step 7: Configure Azure Firewall

In Azure Portal → VM → Network settings → Add inbound port rules:

1. **Port 80 (HTTP)**:
   - Source: Any
   - Destination port: 80
   - Protocol: TCP
   - Action: Allow
   - Name: Allow-HTTP

2. **Port 443 (HTTPS)**:
   - Source: Any
   - Destination port: 443
   - Protocol: TCP
   - Action: Allow
   - Name: Allow-HTTPS

3. **Port 8000** (if not already open):
   - Source: Any
   - Destination port: 8000
   - Protocol: TCP
   - Action: Allow
   - Name: Allow-Backend

---

## Frontend Deployment

### Step 1: Prepare Vite Configuration

Updated `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### Step 2: Create Cloudflare Pages Configuration Files

Created `frontend/public/_redirects`:

```
/* /index.html 200
```

Created `frontend/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.js
  Content-Type: application/javascript; charset=utf-8

/*.css
  Content-Type: text/css; charset=utf-8
```

### Step 3: Deploy to Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages → Create a project
2. Connect to GitHub repository
3. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
4. Add environment variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://api.artiumm.tech`
5. Click Deploy

---

## Domain Configuration

### Step 1: Get Free Domain

Used GitHub Student Developer Pack to get a free `.tech` domain from get.tech:
- Domain: `artiumm.tech`

### Step 2: Configure Cloudflare DNS

1. Add domain to Cloudflare
2. Update nameservers at domain registrar to Cloudflare's nameservers
3. Add DNS records:

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | api | 20.24.66.144 | Proxied (Orange) | Auto |
| CNAME | @ | artium.pages.dev | Proxied (Orange) | Auto |
| CNAME | www | artium.pages.dev | Proxied (Orange) | Auto |

### Step 3: Configure SSL/TLS

1. Go to SSL/TLS → Overview
2. Change encryption mode to **"Flexible"**
   - Browser ↔ Cloudflare: HTTPS (encrypted)
   - Cloudflare ↔ Origin: HTTP (VPS doesn't have SSL cert)

### Step 4: Add Custom Domain to Cloudflare Pages

1. Go to Cloudflare Pages → Project → Custom domains
2. Add `artiumm.tech` and `www.artiumm.tech`
3. Cloudflare automatically provisions SSL certificates

---

## Problems & Solutions

### Problem 1: Docker Hub Authentication Failed

**Error**: `access denied` when pushing to Docker Hub

**Cause**: Incorrect Docker Hub username in workflow (used `shalinshah7` instead of `shalinshah07`)

**Solution**: 
- Corrected `DOCKER_IMAGE` in workflow to `shalinshah07/artium-backend`
- Updated `DOCKER_USERNAME` secret to `shalinshah07`

---

### Problem 2: GitHub Actions SSH Connection Failed

**Error**: `Permission denied (publickey)` during deployment

**Cause**: GitHub Actions didn't have SSH access to VPS

**Solution**:
```bash
# On VPS, generate SSH key without passphrase
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# Add private key to GitHub secrets as VPS_SSH_KEY
# Add public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

---

### Problem 3: Cloudflare Pages Showing Blank Page

**Error**: Frontend deployed but showing blank white page

**Cause**: Incorrect build settings in Cloudflare Pages

**Solution**:
- Set **Root directory** to `frontend` (not the repository root)
- Set **Build output directory** to `dist`
- Ensure `_redirects` file exists for SPA routing

---

### Problem 4: Mixed Content Error

**Error**: `Mixed Content: The page at 'https://artiumm.tech' was loaded over HTTPS, but requested an insecure resource 'http://20.24.66.144:8000'`

**Cause**: Frontend was using HTTP backend URL while loaded via HTTPS

**Solution**:
- Created subdomain `api.artiumm.tech` pointing to VPS
- Updated frontend environment variable to `https://api.artiumm.tech`
- Configured Cloudflare DNS with proxied A record

---

### Problem 5: Error 522 - Connection Timed Out

**Error**: Cloudflare Error 522 when accessing `https://api.artiumm.tech`

**Cause**: 
- Cloudflare expects origin server on port 80 when using "Flexible" SSL
- Backend was running on port 8000
- Cloudflare couldn't connect to port 8000

**Solution**:
- Installed Nginx as reverse proxy on VPS
- Configured Nginx to listen on port 80 and proxy to localhost:8000
- Opened port 80 in Azure firewall rules
- Set Cloudflare SSL mode to "Flexible"

---

### Problem 6: CORS Policy Blocking Requests

**Error**: `Access to fetch at 'https://api.artiumm.tech/api/auth/login' from origin 'https://artiumm.tech' has been blocked by CORS policy`

**Cause**: Backend CORS configuration didn't include production domain

**Solution**:
- Added GitHub secret `CORS_ORIGINS` with value: `https://artiumm.tech,https://artium.pages.dev`
- Backend `main.py` already had logic to read this environment variable
- Redeployed backend to apply changes

---

### Problem 7: 500 Internal Server Error

**Error**: Backend returning 500 errors, no response body

**Cause**: MongoDB database name was empty

**Error in logs**:
```
pymongo.errors.InvalidName: database name cannot be the empty string
```

**Solution**:
- Added GitHub secret `MONGODB_DB` with value: `ai_article_creator`
- Updated MongoDB connection string to include database name:
  ```
  mongodb+srv://vps_admin:PASSWORD@artium-vps-backend.hux3b9m.mongodb.net/ai_article_creator?retryWrites=true&w=majority
  ```
- Redeployed backend

---

### Problem 8: MongoDB Connection String Issues

**Error**: Backend couldn't connect to MongoDB Atlas

**Issues Found**:
1. Missing database name in connection string
2. Weak password (`vps_admin`)
3. Missing recommended connection parameters

**Solution**:
- Updated connection string format:
  ```
  mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority&appName=Artium-vps-backend
  ```
- Verified Network Access in MongoDB Atlas includes VPS IP or `0.0.0.0/0`
- Verified Database Access user has read/write permissions

---

## Final Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                             User                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cloudflare CDN                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  artiumm.tech (Frontend)                                 │   │
│  │  ↳ Cloudflare Pages                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  api.artiumm.tech (Backend API)                          │   │
│  │  ↳ SSL: Flexible (HTTPS → HTTP)                          │   │
│  └────────────────────┬─────────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────────┘
                        │ HTTP
                        │ Port 80
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Azure VPS (20.24.66.144)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Nginx (Reverse Proxy) - Port 80                         │   │
│  │  ↳ Proxy to localhost:8000                               │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│                       │ HTTP                                     │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Docker Container: artium-backend                        │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  FastAPI + Uvicorn (Port 8000)                     │  │   │
│  │  │  ↳ Python 3.11                                     │  │   │
│  │  │  ↳ PyMongo, Google Gemini AI                       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ MongoDB Atlas Connection
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              MongoDB Atlas (Cloud Database)                     │
│  Cluster: artium-vps-backend                                    │
│  Database: ai_article_creator                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Checklist

### Backend Checklist
- [x] Dockerfile created
- [x] docker-compose.yml created
- [x] GitHub Actions workflow configured
- [x] Docker Hub repository created
- [x] GitHub secrets configured
- [x] SSH keys generated and added
- [x] Nginx installed and configured
- [x] Azure firewall rules added (ports 80, 443, 8000)
- [x] MongoDB Atlas connection string configured
- [x] CORS origins configured
- [x] Backend container running

### Frontend Checklist
- [x] Vite config updated
- [x] _redirects file created
- [x] _headers file created
- [x] Cloudflare Pages project created
- [x] Build settings configured correctly
- [x] Environment variable set (VITE_API_BASE_URL)
- [x] Frontend deployed

### Domain Checklist
- [x] Domain purchased/obtained (artiumm.tech)
- [x] Domain added to Cloudflare
- [x] Nameservers updated
- [x] DNS A record for api.artiumm.tech
- [x] DNS CNAME for root and www
- [x] SSL/TLS mode set to Flexible
- [x] Custom domain added to Cloudflare Pages
- [x] SSL certificates provisioned

---

## Useful Commands

### Backend Deployment

```bash
# Check Docker container status
docker ps

# View container logs
docker logs artium-backend --tail 50
docker logs artium-backend --follow

# Restart container
docker restart artium-backend

# Stop and remove container
docker stop artium-backend
docker rm artium-backend

# Pull latest image manually
docker pull shalinshah07/artium-backend:latest

# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Frontend Deployment

```bash
# Build locally
cd frontend
npm install
npm run build

# Test build locally
npm run preview

# Trigger redeploy via git
git commit --allow-empty -m "Redeploy"
git push
```

### Testing Endpoints

```bash
# Test backend health
curl http://20.24.66.144:8000/api/health
curl https://api.artiumm.tech/api/health

# Test with CORS headers
curl -H "Origin: https://artiumm.tech" https://api.artiumm.tech/api/health

# Test OPTIONS preflight
curl -X OPTIONS \
  -H "Origin: https://artiumm.tech" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  https://api.artiumm.tech/api/auth/login
```

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db?options` |
| MONGODB_DB | Database name | `ai_article_creator` |
| GEMINI_API_KEY | Google Gemini API key | `AIza...` |
| JWT_SECRET | Secret for JWT token signing | Random 32+ character string |
| CORS_ORIGINS | Allowed origins (comma-separated) | `https://artiumm.tech,https://artium.pages.dev` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API base URL | `https://api.artiumm.tech` |

---

## Monitoring & Maintenance

### Check Backend Health
```bash
# Via direct IP
curl http://20.24.66.144:8000/api/health

# Via domain
curl https://api.artiumm.tech/api/health
```

### Monitor Docker Logs
```bash
# Real-time logs
docker logs -f artium-backend

# Last 100 lines
docker logs --tail 100 artium-backend
```

### Check Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Test
```bash
# SSH into VPS
ssh azureuser@20.24.66.144

# Enter backend container
docker exec -it artium-backend bash

# Test MongoDB connection (inside container)
python3 -c "from pymongo import MongoClient; import os; client = MongoClient(os.getenv('MONGODB_URI')); print(client.list_database_names())"
```

---

## Security Considerations

1. **SSH Keys**: Private keys stored securely in GitHub Secrets, never committed to repository
2. **Environment Variables**: All sensitive data stored in GitHub Secrets, not in code
3. **CORS**: Configured to only allow specific origins
4. **SSL/TLS**: Cloudflare provides SSL certificates and DDoS protection
5. **MongoDB**: Network access restricted, authentication enabled
6. **Docker**: Containers run with minimal privileges
7. **Nginx**: Proper proxy headers set for security

---

## Backup & Recovery

### Database Backup (MongoDB Atlas)
- Automatic backups enabled in MongoDB Atlas
- Manual backup via MongoDB Compass or mongodump

### Application Backup
- Code stored in GitHub repository
- Docker images stored in Docker Hub
- Easy rollback by deploying previous image tag

### Disaster Recovery Steps
1. Deploy previous Docker image version
2. Restore MongoDB from Atlas backup
3. Redeploy frontend from previous commit

---

## Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Azure VPS | B1s (1 vCPU, 1GB RAM) | ~$10/month |
| MongoDB Atlas | M0 Free Tier | Free |
| Cloudflare Pages | Free Plan | Free |
| Cloudflare DNS/CDN | Free Plan | Free |
| Domain (.tech) | GitHub Student Pack | Free (1 year) |
| Docker Hub | Free Tier | Free |
| **Total** | | **~$10/month** |

---

## Future Improvements

1. **SSL on Origin**: Add Let's Encrypt SSL certificate on VPS for Full (strict) SSL mode
2. **CI/CD for Frontend**: Add GitHub Actions workflow for frontend
3. **Database**: Migrate to production MongoDB Atlas tier for better performance
4. **Monitoring**: Add Sentry for error tracking, Prometheus for metrics
5. **Caching**: Implement Redis for session management and caching
6. **CDN**: Use Cloudflare's full CDN capabilities for static assets
7. **Health Checks**: Implement comprehensive health check endpoints
8. **Logging**: Centralized logging with ELK stack or similar
9. **Staging Environment**: Create separate staging deployment
10. **Automated Testing**: Add integration and E2E tests to CI/CD pipeline

---

## Support & Troubleshooting

### Common Issues

**Issue**: 502 Bad Gateway
- **Cause**: Backend container not running
- **Fix**: Check Docker logs, restart container

**Issue**: 522 Connection Timed Out
- **Cause**: Port 80 not accessible or Nginx not running
- **Fix**: Check Azure firewall, restart Nginx

**Issue**: CORS errors
- **Cause**: Origin not in CORS_ORIGINS
- **Fix**: Update GitHub secret, redeploy

**Issue**: 500 Internal Server Error
- **Cause**: Database connection failed or environment variable missing
- **Fix**: Check Docker logs, verify MongoDB connection, check secrets

---

## Conclusion

This deployment setup provides:
- ✅ Automated CI/CD pipeline with GitHub Actions
- ✅ Zero-downtime deployments
- ✅ HTTPS everywhere with Cloudflare
- ✅ Custom domain with free SSL
- ✅ Scalable architecture
- ✅ Cost-effective (~$10/month)
- ✅ Easy rollback and disaster recovery

The application is now live at:
- **Frontend**: https://artiumm.tech
- **Backend API**: https://api.artiumm.tech

---

**Deployment Date**: February 17, 2026  
**Last Updated**: February 17, 2026  
**Version**: 1.0.0
