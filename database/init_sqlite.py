"""
DakDrishti 4.0 - SQLite Local Database Initializer
Creates database/dak_drishti.db for automatic zero-config persistent storage.
"""

import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'database', 'dak_drishti.db')

def init_sqlite():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable WAL mode for performance
    cursor.execute("PRAGMA journal_mode=WAL;")

    # 1. Counters
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS counters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        nameHi TEXT,
        category TEXT NOT NULL,
        operatorName TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'idle',
        servingToken TEXT DEFAULT 'None',
        operatorPresent INTEGER DEFAULT 1,
        unmannedSec INTEGER DEFAULT 0,
        queueCount INTEGER DEFAULT 0,
        servedCountToday INTEGER DEFAULT 0,
        slaThresholdSec INTEGER DEFAULT 420,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Tokens
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        counterId INTEGER NOT NULL,
        citizenName TEXT NOT NULL,
        mobile TEXT,
        priority INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'WAITING',
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        waitSec INTEGER DEFAULT 0,
        serviceSec INTEGER DEFAULT 0,
        sla_breached INTEGER DEFAULT 0,
        time TEXT
    );
    """)

    # 3. AI Alerts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        suggestedAction TEXT,
        counterId INTEGER,
        timestamp TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Citizen Feedback
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizen_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id TEXT,
        service_category TEXT NOT NULL,
        rating_score INTEGER NOT NULL,
        comments TEXT,
        sentiment_class TEXT NOT NULL,
        sentiment_confidence REAL DEFAULT 95.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Registered Users Credentials Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        contact TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Seed Counters if empty
    cursor.execute("SELECT COUNT(*) FROM counters")
    if cursor.fetchone()[0] == 0:
        counters_data = [
            (1, "C-01", "Counter 1 - Speed Post & Domestic Mail", "काउंटर 1 - स्पीड पोस्ट एवं डाक सेवा", "mail", "Rameshwar Dayal (PA)", "idle", "None", 1, 0, 0, 0, 420),
            (2, "C-02", "Counter 2 - Express Parcel & COD", "काउंटर 2 - पार्सल एवं ई-कॉमर्स बुकिंग", "parcel", "Priyanka Sharma (PA)", "idle", "None", 1, 0, 0, 0, 480),
            (3, "C-03", "Counter 3 - POSB Banking & IPPB", "काउंटर 3 - डाकघर बचत बैंक एवं IPPB", "banking", "Virender Nath (Sr. PA)", "idle", "None", 1, 0, 0, 0, 600),
            (4, "C-04", "Counter 4 - Aadhaar, PLI & Citizen Services", "काउंटर 4 - आधार, बीमा एवं नागरिक सेवाएं", "citizen", "Anita Kumari (PA)", "idle", "None", 1, 0, 0, 0, 600)
        ]
        cursor.executemany("""
        INSERT INTO counters (id, code, name, nameHi, category, operatorName, status, servingToken, operatorPresent, unmannedSec, queueCount, servedCountToday, slaThresholdSec)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, counters_data)

    # Seed Initial Alert if empty
    cursor.execute("SELECT COUNT(*) FROM ai_alerts")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO ai_alerts (severity, title, description, suggestedAction, counterId, timestamp)
        VALUES ('info', 'System Online — Fresh Shift Ready', 'All 4 service counters are active and ready for citizen intake. Operators on duty.', 'Standard monitoring active.', NULL, '09:00 AM')
        """)

    # Seed Default Users if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        default_users = [
            ("System Admin", "admin", "employee", "admin123"),
            ("System Admin", "admin@indiapost.gov.in", "employee", "admin123"),
            ("Counter Operator", "employee", "employee", "password"),
            ("Staff Operator", "emp001", "employee", "password123"),
            ("Demo Citizen", "9876543210", "customer", "citizen123")
        ]
        cursor.executemany("""
        INSERT INTO users (full_name, contact, role, password)
        VALUES (?, ?, ?, ?)
        """, default_users)

    conn.commit()
    conn.close()
    print(f"[SQLite DB Initialized] Path: {DB_PATH}")

if __name__ == '__main__':
    init_sqlite()
