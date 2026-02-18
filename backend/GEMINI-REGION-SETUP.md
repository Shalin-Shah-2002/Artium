# Gemini API Regional Access Setup

## Problem: "User location is not supported for the API use"

If you're seeing this error, it means the Google Gemini API is not available in your geographic region. Google restricts access to Gemini API based on location.

## Supported Regions

Gemini API is currently available in these regions:
- United States
- United Kingdom
- European Union countries
- Canada
- Australia
- Japan
- South Korea
- Singapore
- And several other countries

Check the full list at: https://ai.google.dev/gemini-api/docs/available-regions

## Solutions

### Solution 1: Use a VPN (Recommended for Development)

1. **Install a VPN service** (ProtonVPN, NordVPN, ExpressVPN, etc.)
2. **Connect to a supported region** (US or EU recommended)
3. **Verify your connection** at https://aistudio.google.com/
4. **Test your API key** - it should now work

### Solution 2: Create API Key in Supported Region

1. **Use a VPN** to connect to a supported region
2. **Visit** https://aistudio.google.com/apikey
3. **Create a new API key** while connected via VPN
4. **Copy the API key** and use it in your application
5. Keep the VPN connected when making API requests

### Solution 3: Use Proxy Server (Production)

If deploying to production in an unsupported region:

1. **Set up a proxy server** in a supported region (AWS EC2, Google Cloud, Azure VM)
2. **Configure your backend** to route Gemini API requests through the proxy
3. **Set environment variables**:
   ```bash
   export HTTPS_PROXY=http://your-proxy-server:port
   export HTTP_PROXY=http://your-proxy-server:port
   ```

### Solution 4: Deploy Backend in Supported Region

Deploy your backend service in a cloud provider's supported region:

- **AWS**: US-East-1, EU-West-1
- **Google Cloud**: us-central1, europe-west1
- **Azure**: East US, West Europe
- **Heroku**: US or EU regions
- **Render**: US regions
- **Fly.io**: Choose US or EU regions

## Verification Steps

1. **Check your API key**: Visit https://aistudio.google.com/apikey
2. **Test with VPN**: Enable VPN and try generating an article
3. **Check error messages**: The app now provides detailed error messages
4. **Backend logs**: Check backend logs for specific error details

## Development Workflow

**For local development:**
```bash
1. Start VPN (connect to US/EU)
2. cd backend
3. python -m uvicorn main:app --reload
4. Test API calls
```

**For frontend development:**
```bash
1. Ensure VPN is running
2. cd frontend
3. npm run dev
4. Use a valid Gemini API key from supported region
```

## Testing Your Setup

You can test if Gemini API is accessible from your location:

```python
import google.generativeai as genai

api_key = "YOUR_API_KEY"
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content("Hello, world!")
    print("✅ Success! Gemini API is accessible")
    print(response.text)
except Exception as e:
    print(f"❌ Error: {e}")
    if "location" in str(e).lower():
        print("This is a region restriction issue. Use VPN!")
```

## Alternative AI Services

If VPN/proxy solutions don't work for your use case, consider:

- **OpenAI GPT-4**: Available globally (requires OpenAI API key)
- **Anthropic Claude**: Available in most regions
- **Cohere**: Global availability
- **Open-source models**: Llama, Mistral (self-hosted)

To switch to OpenAI, you would need to:
1. Modify `backend/services/gemini.py` to use OpenAI SDK
2. Update environment variables
3. Obtain OpenAI API key

## Support

If you continue experiencing issues:
1. Check Google AI Studio: https://aistudio.google.com/
2. Review Gemini API docs: https://ai.google.dev/docs
3. Verify your API key is valid
4. Ensure VPN is active and connected to supported region

## Notes

- The error handling in the application has been updated to provide clearer messages
- Generation config parameters have been optimized
- Regional restrictions are enforced at the API level by Google
- Using a VPN is the simplest solution for development
