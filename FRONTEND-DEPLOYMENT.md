# 🚀 Frontend Deployment Guide

## Overview
Deploy your React frontend to Cloudflare Pages (free) with your GitHub Student domain.

---

## 📦 **Option 1: Cloudflare Pages (Recommended)**

### Prerequisites
1. ✅ Cloudflare account (free): [Sign up here](https://dash.cloudflare.com/sign-up)
2. ✅ GitHub Student domain from [GitHub Student Developer Pack](https://education.github.com/pack)

---

### Step 1: Push Frontend to GitHub

Your code should already be on GitHub. If not:
```bash
git add .
git commit -m "Prepare frontend for deployment"
git push origin main
```

---

### Step 2: Deploy to Cloudflare Pages

1. **Go to Cloudflare Pages**
   - Visit: [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
   - Click **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**

2. **Connect GitHub Repository**
   - Select your **Artium** repository
   - Click **Begin setup**

3. **Configure Build Settings**
   ```
   Project name: artium-frontend
   Production branch: main
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: frontend
   ```

4. **Environment Variables**
   Click **Add variable** and add:
   ```
   VITE_API_BASE_URL = http://YOUR_VPS_IP:8000
   ```
   (Replace with your actual VPS IP)

5. **Click "Save and Deploy"**

6. **Wait for Build** (2-3 minutes)
   - Your site will be live at: `https://artium-frontend.pages.dev`

---

### Step 3: Connect Your Custom Domain

#### A. Add Domain to Cloudflare (if not already)

1. **Go to Cloudflare Dashboard** → **Websites** → **Add a site**
2. Enter your domain (e.g., `yourdomain.com`)
3. Select **Free plan**
4. **Update Nameservers** at your domain registrar (Namecheap/Name.com):
   - Go to your domain provider
   - Update nameservers to Cloudflare's (they'll show you which ones)
   - Wait 5-30 minutes for DNS propagation

#### B. Connect Domain to Pages

1. **Go to Pages Project**
   - Cloudflare Dashboard → **Workers & Pages** → **artium-frontend**
   - Click **Custom domains** tab

2. **Add Custom Domain**
   - Click **Set up a custom domain**
   - Enter: `yourdomain.com` or `www.yourdomain.com`
   - Click **Continue**
   - Cloudflare will automatically configure DNS
   - Click **Activate domain**

3. **SSL Certificate** (automatic)
   - Cloudflare automatically provisions SSL certificate
   - Your site will be accessible via `https://yourdomain.com`

---

### Step 4: Update Backend CORS

After deployment, update your backend CORS settings:

**On GitHub Secrets:**
1. Go to your repo → **Settings** → **Secrets** → **Actions**
2. Update **CORS_ORIGINS**:
   ```
   https://yourdomain.com,https://artium-frontend.pages.dev
   ```

**Or in your backend `.env`:**
```env
CORS_ORIGINS=https://yourdomain.com,https://artium-frontend.pages.dev
```

Then redeploy backend (push to main).

---

## 📦 **Option 2: Vercel (Alternative)**

### Quick Deploy

1. **Go to Vercel**: [https://vercel.com/](https://vercel.com/)
2. **Sign in with GitHub**
3. **Import Repository** → Select **Artium**
4. **Configure**:
   ```
   Framework: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
5. **Environment Variables**:
   ```
   VITE_API_BASE_URL = http://YOUR_VPS_IP:8000
   ```
6. **Deploy**
7. **Add Custom Domain**: Settings → Domains → Add your domain

---

## 📦 **Option 3: Netlify (Alternative)**

1. **Go to Netlify**: [https://app.netlify.com/](https://app.netlify.com/)
2. **Add new site** → **Import from Git** → Select repository
3. **Build Settings**:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```
4. **Environment Variables**: Site settings → Build & deploy → Environment
   ```
   VITE_API_BASE_URL = http://YOUR_VPS_IP:8000
   ```
5. **Deploy**
6. **Domain Settings** → Add custom domain

---

## 🔄 GitHub Actions Auto-Deploy (Optional)

To automatically deploy on push, Cloudflare Pages already does this! Every push to `main` triggers a new build.

You can also create a manual workflow:

### Create `.github/workflows/frontend-deploy.yml`:

```yaml
name: Deploy Frontend to Cloudflare Pages

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        run: |
          cd frontend
          npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/dist --project-name=artium-frontend
```

---

## 🔐 Get Cloudflare API Token (for GitHub Actions)

1. **Cloudflare Dashboard** → **My Profile** → **API Tokens**
2. **Create Token** → Use template **"Edit Cloudflare Workers"**
3. **Copy the token**
4. **Add to GitHub Secrets**:
   - `CLOUDFLARE_API_TOKEN` = your token
   - `CLOUDFLARE_ACCOUNT_ID` = found in Cloudflare dashboard URL

---

## 🎓 GitHub Student Domain Setup

### 1. Claim Your Free Domain

1. Go to [GitHub Student Developer Pack](https://education.github.com/pack)
2. Verify student status
3. Claim **Namecheap** or **Name.com** domain (usually `.me` or `.tech` domain)
4. Choose your domain name

### 2. Point Domain to Cloudflare

**At Your Domain Registrar (Namecheap/Name.com):**
1. Go to domain management
2. Update **Nameservers** to Cloudflare's nameservers
3. Save changes
4. Wait 5-30 minutes for propagation

**In Cloudflare:**
1. Add site → Enter your domain
2. Follow the nameserver update instructions
3. Once verified, connect to Pages (Step 3 above)

---

## 🌐 Full Setup Example

Let's say:
- **VPS IP**: `20.123.45.67`
- **Domain**: `yourstartup.me`
- **Backend**: Running on VPS at `http://20.123.45.67:8000`
- **Frontend**: Deployed to Cloudflare Pages

### Configuration:

**Backend Environment (GitHub Secrets):**
```env
CORS_ORIGINS=https://yourstartup.me,https://artium-frontend.pages.dev
```

**Frontend Environment (Cloudflare Pages):**
```env
VITE_API_BASE_URL=http://20.123.45.67:8000
```

**DNS Records in Cloudflare:**
```
Type: CNAME
Name: @ (or www)
Content: artium-frontend.pages.dev
Proxy: Enabled (orange cloud)
```

### For Better Setup (Subdomain for API):

**Option: Use Cloudflare Proxy**

1. **Add A Record** for API subdomain:
   ```
   Type: A
   Name: api
   Content: 20.123.45.67
   Proxy: Enabled
   ```

2. **Update Frontend Env**:
   ```
   VITE_API_BASE_URL=https://api.yourstartup.me
   ```

3. **Update Backend CORS**:
   ```
   CORS_ORIGINS=https://yourstartup.me
   ```

Now your API is at `https://api.yourstartup.me` with free SSL!

---

## ✅ Quick Start Checklist

- [ ] Push code to GitHub
- [ ] Create Cloudflare account
- [ ] Deploy to Cloudflare Pages
- [ ] Claim GitHub Student domain
- [ ] Add domain to Cloudflare
- [ ] Connect domain to Pages
- [ ] Update backend CORS
- [ ] Test your deployed site!

---

## 🚀 Your Live URLs

After setup:
- **Frontend**: `https://yourdomain.com`
- **Backend API**: `http://YOUR_VPS_IP:8000/api`
- **Staging**: `https://artium-frontend.pages.dev`

---

## 🔧 Troubleshooting

### Build Fails
- Check `package.json` has correct build script
- Verify Node version compatibility
- Check build logs in Cloudflare

### API Not Connecting
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend CORS includes frontend URL
- Check browser console for errors

### Domain Not Working
- Wait 30 minutes after DNS changes
- Clear browser cache
- Check DNS propagation: [https://dnschecker.org](https://dnschecker.org)

---

**🎉 You're all set! Your app is now live with a custom domain!**
