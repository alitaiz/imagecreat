# Deployment Guide: AI Photo Editor on Ubuntu 22.04

This guide provides step-by-step instructions for deploying your AI Photo Editor application from GitHub to a VPS running Ubuntu 22.04, served by Nginx on port `4003`.

## Prerequisites

- **VPS:** A server running Ubuntu 22.04.
- **Access:** SSH access to your server with `sudo` privileges.
- **IP Address:** A public IP address for your server (e.g., `74.208.102.216`).
- **Gemini API Key:** A valid API key from Google AI Studio.

---

## Part 1: Server Setup

First, connect to your server via SSH and prepare the environment.

### 1. Update System Packages

Ensure your system's package list and installed packages are up-to-date.

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Nginx

Nginx will act as our web server to serve the application's static files.

```bash
sudo apt install nginx -y
```

### 3. Install Node.js using NVM

We need Node.js to build the project. Installing it via NVM (Node Version Manager) is recommended as it allows you to easily manage multiple Node.js versions.

```bash
# Download and run the NVM installation script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM into the current shell session
# You may need to close and reopen your terminal for this to take effect
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Verify NVM is loaded (optional)
command -v nvm

# Install and use a recent LTS version of Node.js
nvm install --lts
nvm use --lts
```

### 4. Install Git

We'll use Git to clone the project from your GitHub repository.

```bash
sudo apt install git -y
```
---

## Part 2: Project Deployment

Now, we'll get the application code, install dependencies, and build it for production.

### 1. Clone the Project from GitHub

Navigate to your home directory and clone the project from your repository.

```bash
cd ~
git clone https://github.com/alitaiz/imagecreat.git
```

This will create a new directory named `imagecreat`. Navigate into it.

```bash
cd imagecreat
```

### 2. Install Dependencies

Inside the `imagecreat` directory, install the required Node.js packages defined in `package.json`.

```bash
npm install
```

### 3. Build the Application

The project uses Vite to bundle the code for production. The Gemini API key must be provided as an environment variable during this build step.

**IMPORTANT:** Replace `"your_gemini_api_key_here"` with your actual Gemini API key.

```bash
API_KEY="your_gemini_api_key_here" npm run build
```

This command compiles the application into a `dist` directory inside your project folder. The contents of this directory are static and ready to be served.

---

## Part 3: Nginx Configuration

We will configure Nginx to serve the built application on port `4003`.

### 1. Find Your Project's Full Path

Before creating the Nginx config, you need the full path to your project's `dist` folder. While inside the `imagecreat` directory, run the `pwd` command:

```bash
pwd
```

The output will be something like `/home/your_user/imagecreat`. Note this down. The full path to your application's files will be this path with `/dist` appended (e.g., `/home/your_user/imagecreat/dist`).

### 2. Create a New Nginx Configuration File

Use a text editor like `nano` to create a new server block configuration.

```bash
sudo nano /etc/nginx/sites-available/photo-editor
```

### 3. Add the Server Configuration

Paste the following configuration into the file. **Remember to replace `/home/your_user/imagecreat/dist` with the actual, full path you found in the previous step.**

```nginx
server {
    listen 4003;
    listen [::]:4003;

    # Replace with the actual path to your project's dist folder
    root /var/www/imagecreat/dist;
    index index.html;

    server_name 74.208.102.216 _;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

Save the file and exit (`Ctrl+X`, then `Y`, then `Enter`).

### 4. Enable the New Site

Create a symbolic link from the `sites-available` directory to the `sites-enabled` directory to activate the configuration.

```bash
sudo ln -s /etc/nginx/sites-available/photo-editor /etc/nginx/sites-enabled/
```

### 5. Test and Restart Nginx

First, test the Nginx configuration for any syntax errors.

```bash
sudo nginx -t
```

If it shows `syntax is ok` and `test is successful`, restart the Nginx service to apply the changes.

```bash
sudo systemctl restart nginx
```

---

## Part 4: Firewall Configuration

If you have a firewall enabled (like `ufw`), you need to allow traffic on port `4003`.

```bash
# Allow traffic on port 4003
sudo ufw allow 4003/tcp

# Reload the firewall to apply changes
sudo ufw reload
```

---

## Done!

Your application should now be live and accessible at **http://74.208.102.216:4003/**.