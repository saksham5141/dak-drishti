# DakDrishti 4.0 — Complete Hosting & Cloud Deployment Guide

This guide covers 4 easy methods to host **DakDrishti 4.0** on the internet:

---

## 🌟 Method 1: Free Cloud Hosting on Render / Railway (Recommended)

### Deploying to Render.com:
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for DakDrishti 4.0"
   git branch -M main
   git remote add origin https://github.com/your-username/dak-drishti.git
   git push -u origin main
   ```
2. Go to **[Render.com](https://render.com/)** and sign up (Free).
3. Click **"New +"** -> **"Web Service"** -> Connect your GitHub repo.
4. Set the following settings:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python server.py`
5. *(Optional for MySQL on Render)*: Create a free MySQL database on **Aiven.io**, **PlanetScale**, or **Railway**, and add the connection credentials in Render's Environment Variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
6. Click **Deploy**. Your app will be live at `https://dak-drishti.onrender.com`!

---

## ⚡ Method 2: Instant Public HTTPS Link in 30 Seconds (Ngrok / Cloudflare Tunnel)

If you want to instantly share your currently running local app (`http://127.0.0.1:3000`) with anyone on the internet:

### Using Cloudflare Tunnel (Free, No Signup Required):
Download `cloudflared` and run:
```bash
cloudflared tunnel --url http://127.0.0.1:3000
```
It will give you an instant public HTTPS URL like `https://random-subdomain.trycloudflare.com`!

### Using Ngrok:
```bash
ngrok http 3000
```
It gives you a live public link like `https://abc-123.ngrok-free.app`.

---

## 🐳 Method 3: 1-Click Production VPS (AWS EC2 / DigitalOcean / Docker)

You can run both the Web App and MySQL 8.0 database with automatic schema seeding using Docker Compose:

```bash
# Start Web App + MySQL Database in background
docker-compose up -d
```

This will automatically:
- Launch MySQL 8.0 container on port `3306`.
- Automatically execute `database/schema.sql` and `database/seed_data.sql`.
- Launch the Python REST web app on port `8080`.

---

## 🌐 Method 4: Frontend Hosting on Vercel or Netlify

1. Install Vercel CLI or connect via GitHub:
   ```bash
   npx vercel
   ```
2. Or drag and drop the project folder directly onto **[Netlify Drop](https://app.netlify.com/drop)** for instant static CDN deployment.
