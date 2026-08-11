# DakDrishti 4.0 — MySQL Database Setup Guide

This directory contains the complete database scripts and schema required to run **DakDrishti 4.0** on MySQL.

---

## 📁 Files Included

- **`schema.sql`**: Full Data Definition Language (DDL) defining:
  - `postal_circles`, `postal_divisions`, `post_offices`
  - `staff_operators`, `service_categories`, `services_catalog`, `counters`
  - `tokens` (queue transactions with dwell times and SLA breach tracking)
  - `vision_cctv_nodes`, `ai_vision_telemetry`, `ai_alerts`
  - `citizen_feedback` (with AI sentiment classification)
  - `daily_counter_audit`, `predictive_rush_forecast`
- **`seed_data.sql`**: Comprehensive Data Manipulation Language (DML) pre-populating hierarchy data, counters, staff, and telemetry.

---

## 🚀 Quick Setup Instructions

### 1. Create and Seed the Database via MySQL CLI

Run the following commands in your terminal or PowerShell:

```bash
# Log in to MySQL and create the schema
mysql -u root -p < database/schema.sql

# Populate with initial mock and live seed data
mysql -u root -p < database/seed_data.sql
```

*(Alternatively, you can open `database/schema.sql` and `database/seed_data.sql` inside **MySQL Workbench**, **phpMyAdmin**, or **DBeaver** and execute them directly.)*

---

### 2. Configure Environment Variables (Optional)

You can customize database credentials by setting environment variables or creating a `.env` file:

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dak_drishti_db
```

---

### 3. Start Backend Server with MySQL Integration

Install `pymysql` (if you wish to enable direct Python-to-MySQL connection):

```bash
pip install pymysql
python server.py
```

DakDrishti 4.0 will automatically detect MySQL, verify table connectivity, and persist live counter tokens, citizen ratings, and AI CCTV telemetry logs directly into MySQL.
