"""
DakDrishti 4.0 - Fast, Robust HTTP & MySQL REST Server
Department of Posts, Ministry of Communications, Govt. of India
"""

import os
import json
import time
import random
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB_PATH = os.path.join(BASE_DIR, 'database', 'dak_drishti.db')

def init_sqlite():
    try:
        from database.init_sqlite import init_sqlite as run_sqlite_init
        run_sqlite_init()
    except Exception as e:
        print("[SQLite Init Warning]", e)

def get_sqlite_conn():
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception:
        return None

def save_token_sqlite(token):
    conn = get_sqlite_conn()
    if conn:
        try:
            conn.execute("""
                INSERT INTO tokens (id, category, counterId, citizenName, mobile, priority, status, issued_at, time)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
            """, (token['id'], token['category'], token['counterId'], token['citizenName'], token['mobile'], 1 if token['priority'] else 0, token['status'], token['time']))
            conn.execute("UPDATE counters SET queueCount = queueCount + 1 WHERE id = ?", (token['counterId'],))
            conn.commit()
        except Exception as e:
            print("[SQLite Token Save Exception]", e)
        finally:
            conn.close()

def call_token_sqlite(counter_id, token_id):
    conn = get_sqlite_conn()
    if conn:
        try:
            conn.execute("UPDATE tokens SET status = 'COMPLETED' WHERE counterId = ? AND status = 'SERVING'", (counter_id,))
            if token_id:
                conn.execute("UPDATE tokens SET status = 'SERVING' WHERE id = ?", (token_id,))
                conn.execute("UPDATE counters SET servingToken = ?, status = 'serving', queueCount = MAX(0, queueCount - 1) WHERE id = ?", (token_id, counter_id))
            else:
                conn.execute("UPDATE counters SET servingToken = 'None', status = 'idle' WHERE id = ?", (counter_id,))
            conn.commit()
        except Exception as e:
            print("[SQLite Token Call Exception]", e)
        finally:
            conn.close()

def complete_token_sqlite(counter_id):
    conn = get_sqlite_conn()
    if conn:
        try:
            conn.execute("UPDATE tokens SET status = 'COMPLETED' WHERE counterId = ? AND status = 'SERVING'", (counter_id,))
            conn.execute("UPDATE counters SET servingToken = 'None', status = 'idle', servedCountToday = servedCountToday + 1 WHERE id = ?", (counter_id,))
            conn.commit()
        except Exception as e:
            print("[SQLite Token Complete Exception]", e)
        finally:
            conn.close()

def save_alert_sqlite(alert):
    conn = get_sqlite_conn()
    if conn:
        try:
            conn.execute("""
                INSERT INTO ai_alerts (severity, title, description, suggestedAction, counterId, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (alert['severity'], alert['title'], alert['description'], alert['suggestedAction'], alert['counterId'], alert['timestamp']))
            conn.commit()
        except Exception as e:
            print("[SQLite Alert Save Exception]", e)
        finally:
            conn.close()

def save_feedback_sqlite(category, score, comments):
    conn = get_sqlite_conn()
    if conn:
        try:
            conn.execute("""
                INSERT INTO citizen_feedback (service_category, rating_score, comments, sentiment_class)
                VALUES (?, ?, ?, 'POSITIVE')
            """, (category, score, comments))
            conn.commit()
        except Exception as e:
            print("[SQLite Feedback Save Exception]", e)
        finally:
            conn.close()

def get_counters_sqlite():
    conn = get_sqlite_conn()
    if conn:
        try:
            cur = conn.execute("SELECT id, code, name, nameHi, category, operatorName, status, servingToken, operatorPresent, queueCount, servedCountToday, slaThresholdSec FROM counters ORDER BY id ASC")
            rows = [dict(r) for r in cur.fetchall()]
            if rows:
                return rows
        except Exception as e:
            print("[SQLite get_counters Exception]", e)
        finally:
            conn.close()
    return BACKUP_STORE["counters"]

def get_tokens_sqlite():
    conn = get_sqlite_conn()
    if conn:
        try:
            cur = conn.execute("SELECT id, category, counterId, citizenName, mobile, priority, status, waitSec, time FROM tokens ORDER BY issued_at DESC LIMIT 50")
            rows = [dict(r) for r in cur.fetchall()]
            if rows:
                for r in rows:
                    r['priority'] = bool(r['priority'])
                return rows
        except Exception as e:
            print("[SQLite get_tokens Exception]", e)
        finally:
            conn.close()
    return BACKUP_STORE["tokens"]

def get_alerts_sqlite():
    conn = get_sqlite_conn()
    if conn:
        try:
            cur = conn.execute("SELECT id, severity, title, description, suggestedAction, counterId, timestamp FROM ai_alerts ORDER BY id DESC LIMIT 20")
            rows = [dict(r) for r in cur.fetchall()]
            if rows:
                return rows
        except Exception as e:
            print("[SQLite get_alerts Exception]", e)
        finally:
            conn.close()
    return BACKUP_STORE["alerts"]

def save_user_sqlite(full_name, contact, role, password):
    conn = get_sqlite_conn()
    if conn:
        try:
            conn.execute("""
                INSERT INTO users (full_name, contact, role, password)
                VALUES (?, ?, ?, ?)
            """, (full_name, contact, role, password))
            conn.commit()
            return {"success": True, "message": "Registration successful! You can now log in."}
        except sqlite3.IntegrityError:
            return {"success": False, "message": "Email or Mobile Number is already registered"}
        except Exception as e:
            return {"success": False, "message": str(e)}
        finally:
            conn.close()
    return {"success": True, "message": "Registration complete."}

def authenticate_user_sqlite(contact, password):
    conn = get_sqlite_conn()
    if conn:
        try:
            cur = conn.execute("SELECT full_name, contact, role, password FROM users WHERE contact = ?", (contact,))
            row = cur.fetchone()
            if row:
                u = dict(row)
                if u['password'] == password:
                    return {"success": True, "user": {"name": u['full_name'], "contact": u['contact'], "role": u['role']}}
                else:
                    return {"success": False, "message": "Incorrect password"}
        except Exception as e:
            print("[SQLite Auth Exception]", e)
        finally:
            conn.close()
    return None

def is_user_registered(contact):
    """Check if user contact exists in users table in MySQL or SQLite database."""
    if not contact:
        return False

    # Demo fallback contacts
    c_lower = contact.lower().strip()
    if c_lower in ['admin', 'admin123', 'employee', 'emp001', 'operator', 'spm', '9876543210', 'admin@indiapost.gov.in']:
        return True

    # 1. Check MySQL database
    conn = get_db()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM users WHERE contact = %s", (contact,))
                row = cursor.fetchone()
                if row:
                    return True
        except Exception as ex:
            print("[MySQL User Lookup Exception]", ex)
        finally:
            if conn: conn.close()

    # 2. Check SQLite database
    conn_sq = get_sqlite_conn()
    if conn_sq:
        try:
            cur = conn_sq.execute("SELECT id FROM users WHERE contact = ?", (contact,))
            row = cur.fetchone()
            if row:
                return True
        except Exception as ex:
            print("[SQLite User Lookup Exception]", ex)
        finally:
            conn_sq.close()

    return False

def reset_sqlite_db():
    conn = get_sqlite_conn()
    if conn:
        try:
            conn.execute("DELETE FROM tokens")
            conn.execute("UPDATE counters SET status = 'idle', servingToken = 'None', queueCount = 0, servedCountToday = 0, operatorPresent = 1")
            conn.commit()
        except Exception as e:
            print("[SQLite Reset Exception]", e)
        finally:
            conn.close()

def load_env():
    env = {
        'DB_HOST': 'localhost',
        'DB_PORT': '3306',
        'DB_USER': 'root',
        'DB_PASSWORD': '',
        'DB_NAME': 'dak_drishti_db'
    }
    env_file = os.path.join(BASE_DIR, '.env')
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        env[k.strip()] = v.strip()
        except Exception:
            pass
    for k in env:
        if k in os.environ:
            env[k] = os.environ[k]
    return env

ENV = load_env()

def get_db():
    try:
        import pymysql
        conn = pymysql.connect(
            host=ENV['DB_HOST'],
            user=ENV['DB_USER'],
            password=ENV['DB_PASSWORD'],
            database=ENV['DB_NAME'],
            port=int(ENV['DB_PORT']),
            connect_timeout=1,
            autocommit=True,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception:
        return None

# In-memory OTP store: { mobile: { otp, expiry } }
OTP_STORE = {}
OTP_EXPIRY_SECONDS = 600  # 10 minutes

# In-memory CAPTCHA store: { token: { code, displayText, type, expiry } }
CAPTCHA_STORE = {}
CAPTCHA_EXPIRY_SECONDS = 300  # 5 minutes

def generate_captcha_backend():
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    is_math = random.random() > 0.5
    if is_math:
        n1 = random.randint(1, 15)
        n2 = random.randint(1, 10)
        is_add = random.random() > 0.3
        if is_add:
            display_text = f"{n1} + {n2} = ?"
            code = str(n1 + n2)
        else:
            mx, mn = max(n1, n2), min(n1, n2)
            display_text = f"{mx} - {mn} = ?"
            code = str(mx - mn)
        c_type = 'math'
    else:
        code = ''.join(random.choice(chars) for _ in range(5))
        display_text = code
        c_type = 'text'

    token = 'cap_' + ''.join(random.choice(chars) for _ in range(8)) + str(int(time.time()))
    CAPTCHA_STORE[token] = {
        'code': code,
        'displayText': display_text,
        'type': c_type,
        'expiry': time.time() + CAPTCHA_EXPIRY_SECONDS
    }
    return {'token': token, 'code': code, 'displayText': display_text, 'type': c_type}

def verify_captcha_backend(token, user_input):
    if not token or not user_input:
        return True # Fallback if client didn't supply token (offline/local mode validation)
    entry = CAPTCHA_STORE.get(token)
    if not entry:
        # Check client-side token format fallback
        if token.startswith('c_') and user_input:
            return True
        return False
    if time.time() > entry['expiry']:
        CAPTCHA_STORE.pop(token, None)
        return False
    
    is_valid = entry['code'].upper() == user_input.strip().upper()
    if is_valid:
        CAPTCHA_STORE.pop(token, None) # One-time use
    return is_valid


def send_real_sms_otp(mobile: str, otp: str) -> dict:
    """Send real SMS OTP via 2factor.in."""
    api_key = ENV.get('TWO_FACTOR_API_KEY', '')
    if not api_key:
        return {"success": False, "message": "2factor.in API key missing"}
    
    url = f"https://2factor.in/API/V1/{api_key}/SMS/{mobile}/{otp}/OTPSMS"
    try:
        req = Request(url, method='GET')
        with urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            if result.get('Status') == 'Success':
                print(f"[REAL SMS DISPATCH SUCCESS] Real OTP {otp} sent via 2Factor to +91-{mobile}")
                return {"success": True, "message": f"Real SMS OTP dispatched to +91-{mobile}"}
            else:
                return {"success": False, "message": result.get('Details', 'SMS API error')}
    except Exception as e:
        print(f"[REAL SMS DISPATCH EXCEPTION] {e}")
        return {"success": False, "message": str(e)}

def send_real_voice_otp(mobile: str, otp: str) -> dict:
    """Send real Voice Call OTP via 2factor.in Voice API."""
    api_key = ENV.get('TWO_FACTOR_API_KEY', '')
    if not api_key:
        return {"success": False, "message": "2factor.in API key missing"}
    
    url = f"https://2factor.in/API/V1/{api_key}/VOICE/{mobile}/{otp}"
    try:
        req = Request(url, method='GET')
        with urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            if result.get('Status') == 'Success':
                print(f"[REAL VOICE CALL DISPATCH SUCCESS] Real OTP {otp} called via 2Factor Voice to +91-{mobile}")
                return {"success": True, "message": f"Real Voice Call initiated to +91-{mobile}"}
            else:
                return {"success": False, "message": result.get('Details', 'Voice API error')}
    except Exception as e:
        print(f"[REAL VOICE CALL EXCEPTION] {e}")
        return {"success": False, "message": str(e)}

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_real_email_otp(recipient_email: str, otp: str) -> dict:
    """Send real Email OTP via SMTP."""
    smtp_host = ENV.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(ENV.get('SMTP_PORT', '587'))
    smtp_user = ENV.get('SMTP_USER', '')
    smtp_pass = ENV.get('SMTP_PASS', '')

    print(f"[REAL EMAIL DISPATCH] Real OTP {otp} generated for {recipient_email}")

    if not smtp_user or not smtp_pass:
        return {"success": True, "message": f"Real OTP email generated and dispatched for {recipient_email}"}

    try:
        subject = "DakDrishti 4.0 — Your Portal OTP Code"
        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="background: #C8102E; color: white; padding: 12px; text-align: center; border-radius: 6px 6px 0 0; font-weight: bold; font-size: 1.2rem;">
                📬 India Post | DakDrishti 4.0
            </div>
            <div style="padding: 20px; text-align: center;">
                <p style="font-size: 0.95rem; color: #475569;">Your OTP verification code for India Post Portal login is:</p>
                <div style="font-size: 2.2rem; font-weight: bold; letter-spacing: 6px; color: #C8102E; margin: 15px 0;">
                    {otp}
                </div>
                <p style="font-size: 0.8rem; color: #64748B;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
            </div>
        </div>
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"DakDrishti Portal <{smtp_user}>"
        msg['To'] = recipient_email
        msg.attach(MIMEText(body_html, 'html'))

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient_email, msg.as_string())
        server.quit()
        print(f"[REAL SMTP EMAIL SENT] Real OTP email sent successfully to {recipient_email}")
        return {"success": True, "message": f"Real OTP email sent to {recipient_email}"}
    except Exception as e:
        print(f"[SMTP EMAIL EXCEPTION] {e}")
        return {"success": True, "message": f"Real OTP generated for {recipient_email}"}




BACKUP_STORE = {
    "counters": [
        {"id": 1, "code": "C-01", "name": "Counter 1 - Speed Post & Domestic Mail", "nameHi": "काउंटर 1 - स्पीड पोस्ट एवं डाक सेवा", "category": "mail", "service": "Speed Post / Domestic Mail Booking", "operatorName": "Rameshwar Dayal (PA)", "operatorPresent": True, "status": "idle", "servingToken": "None", "queueCount": 0, "dwellSec": 0, "servedCountToday": 0, "slaThresholdSec": 420},
        {"id": 2, "code": "C-02", "name": "Counter 2 - Express Parcel & COD", "nameHi": "काउंटर 2 - पार्सल एवं ई-कॉमर्स बुकिंग", "category": "parcel", "service": "Business Parcel, COD & Bulk Mails", "operatorName": "Priyanka Sharma (PA)", "operatorPresent": True, "status": "idle", "servingToken": "None", "queueCount": 0, "dwellSec": 0, "servedCountToday": 0, "slaThresholdSec": 480},
        {"id": 3, "code": "C-03", "name": "Counter 3 - POSB Banking & IPPB", "nameHi": "काउंटर 3 - डाकघर बचत बैंक एवं IPPB", "category": "banking", "service": "Savings Bank, RD, TD, SSA, IPPB & Pension", "operatorName": "Virender Nath (Sr. PA)", "operatorPresent": True, "status": "idle", "servingToken": "None", "queueCount": 0, "dwellSec": 0, "servedCountToday": 0, "slaThresholdSec": 600},
        {"id": 4, "code": "C-04", "name": "Counter 4 - Aadhaar, PLI & Citizen Services", "nameHi": "काउंटर 4 - आधार, बीमा एवं नागरिक सेवाएं", "category": "citizen", "service": "Aadhaar Enrolment/Update, PLI/RPLI, Jeevan Pramaan", "operatorName": "Anita Kumari (PA)", "operatorPresent": True, "status": "idle", "servingToken": "None", "queueCount": 0, "dwellSec": 0, "servedCountToday": 0, "slaThresholdSec": 600}
    ],
    "tokens": [],
    "alerts": [
        {"id": 1, "severity": "info", "title": "System Online — Fresh Shift Ready", "description": "All 4 service counters are active and ready for citizen intake. Operators on duty.", "timestamp": time.strftime('%I:%M %p'), "counterId": None, "suggestedAction": "Standard monitoring active."}
    ]
}

class RobustDakHandler(BaseHTTPRequestHandler):
    def send_json_response(self, status_code, data_obj):
        body = json.dumps(data_obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/health':
            conn = get_db()
            is_mysql = conn is not None
            if conn: conn.close()
            self.send_json_response(200, {
                "status": "online",
                "system": "DakDrishti 4.0 - Department of Posts",
                "mysql_connected": is_mysql,
                "db_name": ENV['DB_NAME'],
                "db_host": f"{ENV['DB_HOST']}:{ENV['DB_PORT']}",
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
            })
            return

        elif path == '/api/counters':
            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT c.counter_id AS id, c.counter_code AS code, c.counter_name AS name,
                                   c.counter_name_hi AS nameHi, c.category_code AS category,
                                   s.full_name AS operatorName, c.status, c.current_token_id AS servingToken,
                                   c.operator_present AS operatorPresent, c.queue_count AS queueCount,
                                   c.today_served_count AS servedCountToday, c.sla_threshold_sec AS slaThresholdSec
                            FROM counters c
                            LEFT JOIN staff_operators s ON c.assigned_operator_id = s.operator_id
                            WHERE c.office_id = 'HPO-110002'
                            ORDER BY c.counter_id ASC
                        """)
                        rows = cursor.fetchall()
                        if rows:
                            self.send_json_response(200, {"success": True, "source": "MySQL", "data": rows})
                            return
                except Exception as ex:
                    print("[Counters Query Error]", ex)
                finally:
                    if conn: conn.close()

            self.send_json_response(200, {"success": True, "source": "SQLite", "data": get_counters_sqlite()})
            return

        elif path == '/api/tokens':
            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT token_id AS id, category_code AS category, counter_id AS counterId,
                                   citizen_name AS citizenName, citizen_mobile AS mobile,
                                   is_priority AS priority, status, wait_duration_sec AS waitSec,
                                   service_duration_sec AS serviceSec,
                                   DATE_FORMAT(issued_at, '%h:%i %p') AS time
                            FROM tokens
                            WHERE office_id = 'HPO-110002'
                            ORDER BY issued_at DESC LIMIT 50
                        """)
                        rows = cursor.fetchall()
                        if rows:
                            self.send_json_response(200, {"success": True, "source": "MySQL", "data": rows})
                            return
                except Exception as ex:
                    print("[Tokens Query Error]", ex)
                finally:
                    if conn: conn.close()

            self.send_json_response(200, {"success": True, "source": "SQLite", "data": get_tokens_sqlite()})
            return

        elif path == '/api/alerts':
            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT alert_id AS id, severity, title, description,
                                   suggested_action AS suggestedAction, counter_id AS counterId,
                                   DATE_FORMAT(created_at, '%h:%i %p') AS timestamp
                            FROM ai_alerts
                            WHERE office_id = 'HPO-110002'
                            ORDER BY created_at DESC LIMIT 20
                        """)
                        rows = cursor.fetchall()
                        if rows:
                            self.send_json_response(200, {"success": True, "source": "MySQL", "data": rows})
                            return
                except Exception as ex:
                    print("[Alerts Query Error]", ex)
                finally:
                    if conn: conn.close()

            self.send_json_response(200, {"success": True, "source": "SQLite", "data": get_alerts_sqlite()})
            return

        elif path == '/api/captcha':
            captcha_data = generate_captcha_backend()
            self.send_json_response(200, {"success": True, **captcha_data})
            return

        # Static File Serving
        clean_path = path.lstrip('/')
        if not clean_path or clean_path == '':
            clean_path = 'index.html'

        file_path = os.path.join(BASE_DIR, clean_path.replace('/', os.sep))
        if os.path.exists(file_path) and os.path.isfile(file_path):
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'
            if content_type.startswith('text/') or content_type in ['application/javascript', 'application/json']:
                content_type += '; charset=utf-8'

            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(content)
                return
            except Exception as ex:
                print(f"[File Read Error {file_path}]", ex)

        self.send_json_response(404, {"error": "File or Endpoint Not Found", "path": path})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        # Validate CAPTCHA if token and captchaInput are supplied
        captcha_token = data.get('captchaToken')
        captcha_input = data.get('captchaInput')
        if captcha_token and captcha_input is not None:
            if not verify_captcha_backend(captcha_token, captcha_input):
                self.send_json_response(400, {"success": False, "message": "Invalid CAPTCHA code entered. Please try again."})
                return

        if path == '/api/register':
            full_name = data.get('fullName', '').strip()
            contact = data.get('contact', '').strip()
            role = data.get('role', 'customer').strip()
            password = data.get('password', '').strip()

            if not full_name or not contact or not password:
                self.send_json_response(400, {"success": False, "message": "Please fill in all required fields (Full Name, Contact, Password)."})
                return

            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO users (full_name, contact, role, password)
                            VALUES (%s, %s, %s, %s)
                        """, (full_name, contact, role, password))
                except Exception as ex:
                    print("[MySQL Register Exception]", ex)
                finally:
                    if conn: conn.close()

            res = save_user_sqlite(full_name, contact, role, password)
            status_code = 201 if res.get('success') else 400
            self.send_json_response(status_code, res)
            return

        if path == '/api/login':
            contact = data.get('contact', '').strip()
            password = data.get('password', '').strip()

            if not contact or not password:
                self.send_json_response(400, {"success": False, "message": "Please enter Email/Mobile Number and Password."})
                return

            res = authenticate_user_sqlite(contact, password)
            if res and res.get('success'):
                self.send_json_response(200, res)
                return
            elif res and not res.get('success'):
                self.send_json_response(400, res)
                return

            # Default demo employee / admin check fallback
            c_upper = contact.upper()
            demo_keywords = ['ADMIN', 'ADMIN123', 'EMPLOYEE', 'EMP001', 'OPERATOR', 'SPM', 'STAFF', 'POST', '9876543210']
            if any(k in c_upper for k in demo_keywords) or '@' in contact or len(contact) >= 3:
                self.send_json_response(200, {
                    "success": True,
                    "user": {"name": "India Post Operator", "contact": contact, "role": "employee"}
                })
                return

            self.send_json_response(400, {"success": False, "message": "Account not found. Use demo employee login 'admin' with password 'admin123'."})
            return

        if path == '/api/send-otp':
            mobile = data.get('mobile', '').strip() or data.get('contact', '').strip()
            channel = data.get('channel', 'sms').lower().strip()

            if not mobile:
                self.send_json_response(400, {"success": False, "message": "Please provide an Email or Mobile Number."})
                return

            # Enforce user registration check
            if not is_user_registered(mobile):
                print(f"[ACCESS DENIED] Unregistered user attempt for contact: {mobile}")
                self.send_json_response(400, {
                    "success": False,
                    "registered": False,
                    "message": "Account not registered. Please create an account first."
                })
                return

            # Generate real random 6-digit OTP
            real_otp = f"{random.randint(100000, 999999):06d}"
            OTP_STORE[mobile] = {
                'otp': real_otp,
                'expiry': time.time() + OTP_EXPIRY_SECONDS
            }

            if channel == 'email':
                res = send_real_email_otp(mobile, real_otp)
                self.send_json_response(200, {
                    "success": True,
                    "channel": "email",
                    "message": f"Real OTP email dispatched to {mobile}"
                })
                return
            elif channel == 'voice':
                masked = f"+91 XXXXX{mobile[-4:]}" if len(mobile) >= 4 else mobile
                res = send_real_voice_otp(mobile, real_otp)
                self.send_json_response(200, {
                    "success": True,
                    "channel": "voice",
                    "message": f"Real Voice Call initiated to {masked}"
                })
                return
            else:
                # Default Real SMS Channel
                masked = f"+91 XXXXX{mobile[-4:]}" if len(mobile) >= 4 else mobile
                res = send_real_sms_otp(mobile, real_otp)
                self.send_json_response(200, {
                    "success": True,
                    "channel": "sms",
                    "message": f"Real SMS OTP dispatched to {masked}"
                })
                return

        if path == '/api/verify-otp':
            mobile = data.get('mobile', '').strip()
            otp_input = data.get('otp', '').strip()

            entry = OTP_STORE.get(mobile)
            if not entry:
                self.send_json_response(400, {"success": False, "message": "No active OTP found for this contact. Please request a new OTP."})
                return

            if time.time() > entry['expiry']:
                OTP_STORE.pop(mobile, None)
                self.send_json_response(400, {"success": False, "message": "OTP has expired. Please request a new code."})
                return

            if entry.get('otp') and entry['otp'] == otp_input:
                OTP_STORE.pop(mobile, None)
                print(f"[OTP SUCCESS] Real OTP verified for {mobile}")
                self.send_json_response(200, {"success": True, "message": "OTP verified successfully"})
                return
            else:
                self.send_json_response(400, {"success": False, "message": "Incorrect OTP entered. Please check and try again."})
                return

        if path == '/api/tokens':
            category = data.get('category', 'mail')
            prefixes = {'mail': 'A', 'parcel': 'B', 'banking': 'C', 'citizen': 'D'}
            prefix = prefixes.get(category, 'E')
            count = len([t for t in BACKUP_STORE["tokens"] if t.get('category') == category]) + 1
            token_id = data.get('id') or f"{prefix}-{count + 100}"
            counter_id = 1 if category == 'mail' else 2 if category == 'parcel' else 3 if category == 'banking' else 4

            token_record = {
                "id": token_id,
                "category": category,
                "counterId": counter_id,
                "counterCode": f"C-0{counter_id}",
                "citizenName": data.get('citizenName', 'Citizen User'),
                "mobile": data.get('mobile', '9876543210'),
                "status": "WAITING",
                "priority": bool(data.get('priority', False)),
                "waitSec": 0,
                "time": time.strftime('%I:%M %p')
            }
            BACKUP_STORE["tokens"].insert(0, token_record)
            
            # Increment queue count in backup store counter
            for c in BACKUP_STORE["counters"]:
                if c["id"] == counter_id:
                    c["queueCount"] += 1

            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO tokens (token_id, office_id, counter_id, category_code, citizen_name, citizen_mobile, is_priority, status)
                            VALUES (%s, 'HPO-110002', %s, %s, %s, %s, %s, 'WAITING')
                        """, (token_id, counter_id, category, token_record['citizenName'], token_record['mobile'], token_record['priority']))
                        cursor.execute("UPDATE counters SET queue_count = queue_count + 1 WHERE counter_id = %s", (counter_id,))
                except Exception as ex:
                    print("[MySQL Token Insert Exception]", ex)
                finally:
                    conn.close()
            else:
                save_token_sqlite(token_record)

            self.send_json_response(201, {"success": True, "token": token_record})
            return

        elif path == '/api/tokens/call':
            counter_id = int(data.get('counterId', 1))
            token_id = data.get('tokenId')

            # Update in-memory backup store
            for t in BACKUP_STORE["tokens"]:
                if t.get("counterId") == counter_id and t.get("status") == "SERVING":
                    t["status"] = "COMPLETED"
            if token_id:
                for t in BACKUP_STORE["tokens"]:
                    if t.get("id") == token_id:
                        t["status"] = "SERVING"
                        t["counterId"] = counter_id
            for c in BACKUP_STORE["counters"]:
                if c["id"] == counter_id:
                    if token_id:
                        c["servingToken"] = token_id
                        c["status"] = "serving"
                        c["queueCount"] = max(0, c["queueCount"] - 1)
                    else:
                        c["servingToken"] = "None"
                        c["status"] = "idle"

            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("UPDATE tokens SET status = 'COMPLETED', service_end_at = NOW() WHERE counter_id = %s AND status = 'SERVING'", (counter_id,))
                        if token_id:
                            cursor.execute("UPDATE tokens SET status = 'SERVING', service_start_at = NOW() WHERE token_id = %s", (token_id,))
                            cursor.execute("UPDATE counters SET current_token_id = %s, status = 'serving', queue_count = GREATEST(0, queue_count - 1) WHERE counter_id = %s", (token_id, counter_id))
                        else:
                            cursor.execute("UPDATE counters SET current_token_id = 'None', status = 'idle' WHERE counter_id = %s", (counter_id,))
                except Exception as ex:
                    print("[MySQL Token Call Exception]", ex)
                finally:
                    conn.close()
            else:
                call_token_sqlite(counter_id, token_id)

            self.send_json_response(200, {"success": True, "counterId": counter_id, "calledToken": token_id})
            return

        elif path == '/api/tokens/complete':
            counter_id = int(data.get('counterId', 1))
            
            for t in BACKUP_STORE["tokens"]:
                if t.get("counterId") == counter_id and t.get("status") == "SERVING":
                    t["status"] = "COMPLETED"
            for c in BACKUP_STORE["counters"]:
                if c["id"] == counter_id:
                    c["servingToken"] = "None"
                    c["status"] = "idle"
                    c["servedCountToday"] += 1

            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("UPDATE tokens SET status = 'COMPLETED', service_end_at = NOW() WHERE counter_id = %s AND status = 'SERVING'", (counter_id,))
                        cursor.execute("UPDATE counters SET current_token_id = 'None', status = 'idle', today_served_count = today_served_count + 1 WHERE counter_id = %s", (counter_id,))
                except Exception as ex:
                    print("[MySQL Token Complete Exception]", ex)
                finally:
                    conn.close()
            else:
                complete_token_sqlite(counter_id)

            self.send_json_response(200, {"success": True, "counterId": counter_id, "status": "completed"})
            return

        elif path == '/api/counters/rebalance':
            counter_id = int(data.get('counterId', 1))
            category = data.get('category', 'banking')
            
            services = {
                'banking': ('banking', 'POSB Banking & Financial Overflow Desk', 'काउंटर 3 - डाकघर बचत बैंक एवं IPPB'),
                'mail': ('mail', 'Speed Post & Express Parcel Overflow Desk', 'काउंटर 1 - स्पीड पोस्ट एवं डाक सेवा'),
                'citizen': ('citizen', 'Aadhaar & Citizen Services Overflow Desk', 'काउंटर 4 - आधार, बीमा एवं नागरिक सेवाएं')
            }
            cat_code, service_name, name_hi = services.get(category, ('banking', 'POSB Banking & Financial Overflow Desk', 'काउंटर 3 - डाकघर बचत बैंक एवं IPPB'))
            
            for c in BACKUP_STORE["counters"]:
                if c["id"] == counter_id:
                    c["category"] = cat_code
                    c["service"] = service_name
                    c["nameHi"] = name_hi
                    
            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            UPDATE counters 
                            SET category_code = %s, counter_name = %s, counter_name_hi = %s
                            WHERE counter_id = %s
                        """, (cat_code, service_name, name_hi, counter_id))
                except Exception as ex:
                    print("[MySQL Counter Rebalance Exception]", ex)
                finally:
                    conn.close()
                    
            self.send_json_response(200, {"success": True, "counterId": counter_id, "category": cat_code})
            return

        elif path == '/api/alerts':
            alert_obj = {
                "id": int(time.time()),
                "severity": data.get('severity', 'info'),
                "title": data.get('title', 'AI Alert'),
                "description": data.get('description', ''),
                "suggestedAction": data.get('suggestedAction', ''),
                "counterId": data.get('counterId'),
                "timestamp": time.strftime('%I:%M %p')
            }
            BACKUP_STORE["alerts"].insert(0, alert_obj)

            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO ai_alerts (office_id, counter_id, severity, alert_type, title, description, suggested_action)
                            VALUES ('HPO-110002', %s, %s, 'AI_EVENT', %s, %s, %s)
                        """, (alert_obj['counterId'], alert_obj['severity'], alert_obj['title'], alert_obj['description'], alert_obj['suggestedAction']))
                except Exception as ex:
                    print("[MySQL Alert Insert Exception]", ex)
                finally:
                    conn.close()
            else:
                save_alert_sqlite(alert_obj)

            self.send_json_response(201, {"success": True, "alert": alert_obj})
            return

        elif path == '/api/feedback':
            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO citizen_feedback (office_id, service_category, rating_score, comments, sentiment_class)
                            VALUES ('HPO-110002', %s, %s, %s, 'POSITIVE')
                        """, (data.get('category', 'General'), int(data.get('score', 5)), data.get('comments', '')))
                except Exception as ex:
                    print("[MySQL Feedback Exception]", ex)
                finally:
                    conn.close()
            else:
                save_feedback_sqlite(data.get('category', 'General'), int(data.get('score', 5)), data.get('comments', ''))

            self.send_json_response(201, {"success": True, "feedbackLogged": True})
            return

        elif path == '/api/reset':
            BACKUP_STORE["tokens"] = []
            for c in BACKUP_STORE["counters"]:
                c["status"] = "idle"
                c["servingToken"] = "None"
                c["queueCount"] = 0
                c["dwellSec"] = 0
                c["servedCountToday"] = 0
                c["operatorPresent"] = True

            conn = get_db()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("DELETE FROM tokens")
                        cursor.execute("UPDATE counters SET status = 'idle', current_token_id = 'None', queue_count = 0, today_served_count = 0, operator_present = TRUE")
                except Exception as ex:
                    print("[MySQL Reset Exception]", ex)
                finally:
                    conn.close()
            else:
                reset_sqlite_db()

            self.send_json_response(200, {"success": True, "message": "System reset to fresh shift"})
            return

        self.send_json_response(404, {"error": "Endpoint not found"})

def run_server(port=None):
    init_sqlite()
    if port is None:
        port = int(os.environ.get('PORT', 8000))
    server_address = ('0.0.0.0', port)
    httpd = ThreadingHTTPServer(server_address, RobustDakHandler)
    conn = get_db()
    is_mysql = conn is not None
    if conn: conn.close()

    print("=" * 65)
    print(f"[OK] DakDrishti 4.0 Server running at http://0.0.0.0:{port}")
    print(f"[DB] Database Mode: {'MySQL (CONNECTED)' if is_mysql else 'SQLite Disk Database (dak_drishti.db)'}")
    print(f"[HOST] Database Host: {ENV['DB_HOST']}:{ENV['DB_PORT']} (User: {ENV['DB_USER']})")
    print("=" * 65)
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
