# Gemini API Region Fix - Implementation Guide

## What Changed

The backend has been updated to use Gemini's REST API directly instead of the Python SDK. This provides better control over network requests and makes it easier to work around regional restrictions.

## Option 1: Use a VPN (Easiest)

**This is the fastest solution for immediate use:**

1. **Install a VPN**:
   - Free options: ProtonVPN, Windscribe, TunnelBear
   - Paid options: NordVPN, ExpressVPN, Surfshark

2. **Connect to a supported region**:
   - United States (recommended)
   - United Kingdom
   - European Union countries
   - Canada, Australia, Japan

3. **Restart your backend** (if running):
   ```powershell
   # Stop the backend (Ctrl+C)
   # Then restart:
   cd backend
   python -m uvicorn main:app --reload
   ```

4. **Test the application** - it should work now!

## Option 2: Use a Proxy Server

**If you have access to a proxy in a supported region:**

### Windows PowerShell:
```powershell
$env:HTTPS_PROXY="http://your-proxy-server:port"
$env:HTTP_PROXY="http://your-proxy-server:port"
cd backend
python -m uvicorn main:app --reload
```

### Linux/Mac:
```bash
export HTTPS_PROXY=http://your-proxy-server:port
export HTTP_PROXY=http://your-proxy-server:port
cd backend
python -m uvicorn main:app --reload
```

### Example with a paid proxy service:
```powershell
$env:HTTPS_PROXY="http://username:password@proxy.example.com:8080"
cd backend
python -m uvicorn main:app --reload
```

## Option 3: Deploy Backend to Supported Region

**For production deployment:**

Deploy your backend to a cloud provider in a supported region:

### Render.com (Easy):
1. Create account at render.com
2. New → Web Service
3. Connect your GitHub repo
4. Select region: **Oregon (US West)** or **Frankfurt (EU)**
5. Deploy

### Heroku:
```bash
heroku create your-app-name --region us
git push heroku main
```

### AWS/Google Cloud/Azure:
Deploy to regions like:
- AWS: us-east-1, eu-west-1
- Google Cloud: us-central1, europe-west1
- Azure: East US, West Europe

## Option 4: Use Cloudflare Worker as Proxy

Create a simple Cloudflare Worker to proxy Gemini API requests:

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const apiUrl = 'https://generativelanguage.googleapis.com' + url.pathname + url.search
  
  const response = await fetch(apiUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  return new Response(response.body, {
    status: response.status,
    headers: response.headers
  })
}
```

Then update the backend to use your Cloudflare Worker URL.

## Testing Your Setup

After applying any fix, test with this command in PowerShell:

```powershell
cd backend
python -c "import requests; r = requests.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY', json={'contents': [{'parts': [{'text': 'Hello'}]}]}); print('✅ Success!' if r.status_code == 200 else f'❌ Error: {r.status_code}')"
```

Replace `YOUR_API_KEY` with your actual Gemini API key.

## Installation

Make sure to install the updated dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

The updated `requirements.txt` now includes `requests` which is needed for the direct REST API calls.

## How It Works

The updated implementation:

1. **Uses REST API directly** instead of the Google SDK
2. **Automatically detects proxy settings** from environment variables
3. **Provides clear error messages** when region restrictions are detected
4. **Works with HTTPS_PROXY and HTTP_PROXY** environment variables

## Troubleshooting

### Still getting region errors?

1. **Verify VPN is actually connected**:
   ```powershell
   curl https://ipapi.co/json/
   ```
   Check if the "country_code" matches your VPN location.

2. **Check if proxy is set**:
   ```powershell
   echo $env:HTTPS_PROXY
   ```

3. **Try a different VPN server** - some VPN IPs might be blocked.

4. **Clear DNS cache**:
   ```powershell
   ipconfig /flushdns
   ```

### API key issues?

Visit https://aistudio.google.com/apikey to verify your key is:
- ✅ Valid
- ✅ Not expired
- ✅ Has API access enabled

## Production Recommendations

For production deployments:

1. **Deploy backend in a supported region** (best long-term solution)
2. **Use environment variables** for API configuration
3. **Set up monitoring** to detect region-related failures
4. **Consider fallback AI providers** (OpenAI, Anthropic) as backup

## Need Help?

If none of these solutions work:
1. Check https://ai.google.dev/gemini-api/docs/available-regions
2. Verify your country's current status
3. Consider using alternative AI services (OpenAI GPT-4, Anthropic Claude)
