# DakDrishti 4.0 🏣
> **Measurement & Monitoring of Counter Services — Department of Posts, Govt. of India**

A full-stack **Industry 4.0 AI-powered** post office counter monitoring and management platform built for the Department of Posts, Ministry of Communications.

---

## 🌟 Features

- **🏛️ Digital Twin & Floorplan** — Real-time IoT spatial occupancy map of the post office
- **📹 AI Vision & CCTV HUD** — Multi-camera crowd detection, queue ROI, dwell timers & anomaly alerts
- **👥 Citizen Access & E-Tokens** — Virtual Smart E-Token dispenser with QR, priority routing, postal calculators
- **📊 Multi-Tier Hierarchy Command** — 4-tier dashboards (Post Office → Sub-Division → Division → Regional)
- **📈 Predictive Analytics** — AI rush forecasting, audit reports (CSV/PDF export)
- **🗄️ MySQL Integration** — Full database persistence with REST API backend
- **🔊 Bilingual Announcements** — Hindi & English Web Speech token calling with chime

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.9+
- MySQL 8.0 (optional — app works without it)

### Run Locally
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) Setup MySQL Database
python database/init_db.py

# 3. Start the server
python server.py

# 4. Open browser
# http://localhost:8080
```

---

## 🗄️ MySQL Database Setup

Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dak_drishti_db
```

Then run:
```bash
python database/init_db.py
```

---

## ☁️ Deploy to Cloud (Render.com — Free)

1. Fork this repository
2. Go to [render.com](https://render.com) → New Web Service → Connect this repo
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `python server.py`
5. Add MySQL credentials as Environment Variables
6. Deploy! 🎉

---

## 🐳 Docker Deployment

```bash
# Start App + MySQL together
docker-compose up -d
```

---

## 📁 Project Structure

```
dak-drishti/
├── index.html              # Main app
├── server.py               # Python REST API + MySQL backend
├── requirements.txt        # Python dependencies
├── css/
│   ├── main.css            # Design system & theme tokens
│   └── components.css      # UI components
├── js/
│   ├── app.js              # App entry point & navigation
│   ├── state.js            # Global reactive state store
│   ├── dashboards.js       # Multi-tier hierarchy views
│   ├── citizen.js          # Citizen portal & e-tokens
│   ├── vision.js           # AI CCTV canvas engine
│   ├── floorplan.js        # Digital twin floorplan
│   ├── analytics.js        # Predictive analytics & reports
│   └── speech.js           # Web Speech bilingual announcer
└── database/
    ├── schema.sql           # MySQL table definitions
    ├── seed_data.sql        # Initial seed data
    └── init_db.py          # 1-click database initializer
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, ES6 Modules |
| Backend | Python 3 (ThreadingHTTPServer) |
| Database | MySQL 8.0 (via pymysql) |
| AI Vision | Canvas API (simulated + webcam live) |
| Deployment | Docker, Render.com, Vercel |

---

## 👥 Team Collaboration

Clone the repo:
```bash
git clone https://github.com/YOUR_USERNAME/dak-drishti.git
cd dak-drishti
pip install -r requirements.txt
python server.py
```

---

## 📄 License
Government of India — Department of Posts. For internal evaluation and competition use.
