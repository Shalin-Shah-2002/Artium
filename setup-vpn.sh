#!/bin/bash
# Install Cloudflare WARP VPN on Ubuntu VPS

# Add Cloudflare repository
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list

# Install WARP
sudo apt-get update
sudo apt-get install -y cloudflare-warp

# Register and connect
warp-cli register
warp-cli set-mode proxy
warp-cli connect

# Get proxy URL
echo "WARP Proxy is running on: socks5://127.0.0.1:40000"
echo ""
echo "Add this to your Docker run command:"
echo "-e HTTPS_PROXY=socks5://127.0.0.1:40000"
echo "-e HTTP_PROXY=socks5://127.0.0.1:40000"
