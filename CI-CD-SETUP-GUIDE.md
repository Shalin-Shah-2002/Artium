# CI/CD Setup Guide for Artium Backend

## Overview
This guide walks you through setting up a complete CI/CD pipeline for your backend using Docker, Docker Hub, and GitHub Actions to deploy on your Azure VPS.

## 📁 Files Created
- ✅ `docker-compose.yml` - Multi-container setup (Backend + MongoDB)
- ✅ `.github/workflows/backend-ci-cd.yml` - GitHub Actions CI/CD pipeline
- ✅ `backend/.env.example` - Environment variables template

---

## 🔧 Step 1: Set Up Docker Hub

### 1.1 Create Docker Hub Access Token
1. Go to [Docker Hub](https://hub.docker.com/)
2. Log in with username: **shalinshah7**
3. Click on your profile → **Account Settings** → **Security**
4. Click **New Access Token**
5. Name it: `github-actions-artium`
6. Copy the token (you won't see it again!)

---

## 🔑 Step 2: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

### Docker Hub Credentials
- **DOCKER_USERNAME**: `shalinshah7`
- **DOCKER_TOKEN**: `<paste your Docker Hub token>`

### Azure VPS Credentials
- **VPS_HOST**: Your Azure VPS IP address (e.g., `20.123.45.67`)
- **VPS_USERNAME**: SSH username (usually `azureuser` or `ubuntu`)
- **VPS_SSH_KEY**: Your private SSH key (see Step 3 below)
- **VPS_PORT**: SSH port (default: `22`)
- **VPS_DEPLOY_PATH**: Path to deploy (e.g., `/opt/artium`)

### Application Secrets
- **MONGODB_URI**: MongoDB connection string
  - Local: `mongodb://admin:changeme@localhost:27017`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/`
- **MONGODB_DB**: `ai_article_creator`
- **GEMINI_API_KEY**: Your Google Gemini API key
- **JWT_SECRET**: Random secret key (generate with: `openssl rand -base64 32`)
- **CORS_ORIGINS**: Your frontend URL(s) (e.g., `https://yourdomain.com`)

---

## 🔐 Step 3: Set Up SSH Access to Azure VPS

### 3.1 Generate SSH Key (if you don't have one)
On your local machine:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/artium_deploy
```

### 3.2 Copy Public Key to VPS
```bash
ssh-copy-id -i ~/.ssh/artium_deploy.pub azureuser@YOUR_VPS_IP
```

Or manually:
```bash
# On your local machine
cat ~/.ssh/artium_deploy.pub
# Copy the output

# SSH into your VPS
ssh azureuser@YOUR_VPS_IP

# Add the key
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3.3 Add Private Key to GitHub Secrets
```bash
# Display your private key
cat ~/.ssh/artium_deploy
# Copy the ENTIRE output including "-----BEGIN" and "-----END" lines
# Add to GitHub secret: VPS_SSH_KEY
```

---

## 🖥️ Step 4: Prepare Azure VPS

### 4.1 SSH into Your VPS
```bash
ssh azureuser@YOUR_VPS_IP
```

### 4.2 Install Docker
```bash
# Update packages
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
ssh azureuser@YOUR_VPS_IP

# Verify Docker installation
docker --version
```

### 4.3 Create Deployment Directory
```bash
sudo mkdir -p /opt/artium
sudo chown $USER:$USER /opt/artium
cd /opt/artium
```

### 4.4 Configure Firewall (if using UFW)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8000/tcp  # Backend
sudo ufw allow 80/tcp    # HTTP (if using reverse proxy)
sudo ufw allow 443/tcp   # HTTPS (if using reverse proxy)
sudo ufw enable
sudo ufw status
```

---

## 🚀 Step 5: Test Local Docker Setup

### 5.1 Create .env File
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
nano .env
```

### 5.2 Test Docker Build
```bash
# From project root
docker build -t artium-backend ./backend
```

### 5.3 Test Docker Compose
```bash
# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Test API
curl http://localhost:8000/api/health

# Stop services
docker-compose down
```

---

## 🔄 Step 6: Trigger CI/CD Pipeline

### 6.1 Push to GitHub
```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

### 6.2 Monitor GitHub Actions
1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the workflow run
4. Check for any errors in the logs

---

## 📊 CI/CD Workflow Explained

The workflow has **2 jobs**:

### Job 1: Build and Push
1. Checks out your code
2. Sets up Docker Buildx
3. Logs in to Docker Hub
4. Builds Docker image
5. Pushes to Docker Hub as `shalinshah7/artium-backend:latest`

### Job 2: Deploy (only on main/master branch)
1. Connects to your Azure VPS via SSH
2. Pulls latest Docker image
3. Stops old container
4. Starts new container with environment variables
5. Cleans up old images

---

## 🔍 Troubleshooting

### Build Fails
- Check Docker Hub credentials in GitHub secrets
- Verify Dockerfile syntax in `backend/Dockerfile`

### Deployment Fails
- Verify VPS SSH connection: `ssh -i ~/.ssh/artium_deploy azureuser@YOUR_VPS_IP`
- Check VPS_HOST, VPS_USERNAME, VPS_SSH_KEY secrets
- Ensure Docker is installed on VPS
- Check VPS firewall allows port 8000

### Container Won't Start on VPS
```bash
# SSH into VPS
ssh azureuser@YOUR_VPS_IP

# Check container logs
docker logs artium-backend

# Check if container is running
docker ps -a

# Manually test container
docker run --rm -p 8000:8000 \
  -e MONGODB_URI="your_uri" \
  -e GEMINI_API_KEY="your_key" \
  -e JWT_SECRET="your_secret" \
  shalinshah7/artium-backend:latest
```

### View Application Logs
```bash
# On VPS
docker logs -f artium-backend
```

---

## 🔒 Security Best Practices

1. ✅ **Never commit .env files** - Add to `.gitignore`
2. ✅ **Use strong secrets** - Generate random JWT_SECRET
3. ✅ **Rotate tokens** - Change Docker Hub token periodically
4. ✅ **Limit SSH access** - Use key-based auth only
5. ✅ **Use HTTPS** - Set up reverse proxy with Let's Encrypt
6. ✅ **Monitor logs** - Check for suspicious activity

---

## 🌐 Optional: Set Up Reverse Proxy (Nginx)

### On Azure VPS:
```bash
# Install Nginx
sudo apt-get install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/artium

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/artium /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for HTTPS
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📝 Quick Commands Reference

```bash
# View GitHub Actions logs
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# SSH to VPS
ssh azureuser@YOUR_VPS_IP

# Check container status
docker ps

# View container logs
docker logs -f artium-backend

# Restart container
docker restart artium-backend

# Pull and deploy manually
docker pull shalinshah7/artium-backend:latest
docker stop artium-backend && docker rm artium-backend
docker run -d --name artium-backend -p 8000:8000 \
  --env-file /opt/artium/.env \
  shalinshah7/artium-backend:latest

# Clean up Docker
docker system prune -a
```

---

## 🎯 Next Steps

1. ✅ Complete Steps 1-6 above
2. ⚙️ Set up monitoring (optional)
3. 🔔 Configure Slack/Discord notifications for deployments
4. 📊 Add health checks and logging
5. 🔄 Set up staging environment

---

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check VPS container logs: `docker logs artium-backend`
3. Verify all secrets are correctly set in GitHub
4. Test SSH connection manually
5. Ensure VPS has enough resources (memory, disk space)

---

**Your CI/CD pipeline is now ready! 🎉**

Every push to `main` branch will automatically:
- Build Docker image
- Push to Docker Hub
- Deploy to your Azure VPS
