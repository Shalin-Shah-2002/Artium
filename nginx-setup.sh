#!/bin/bash

# Install nginx
sudo apt-get update
sudo apt-get install -y nginx

# Create nginx config for API
sudo tee /etc/nginx/sites-available/artium-api > /dev/null <<'EOF'
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
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/artium-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "Nginx setup complete! Your API is now accessible on port 80."
