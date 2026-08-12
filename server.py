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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

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

def send_otp_via_2factor(mobile: str) -> dict:
    """Send OTP via 2factor.in (India-specific, auto-generates & sends OTP).
    Returns {success, session_id, message}."""
    api_key = ENV.get('TWO_FACTOR_API_KEY', '')
    if not api_key:
        return {"success": False, "session_id": None, "message": "2factor.in API key not configured (set TWO_FACTOR_API_KEY in .env)"}

    url = f"https://2factor.in/API/V1/{api_key}/SMS/{mobile}/AUTOGEN/OTPSMS"
    try:
        req = Request(url, method='GET')
        with urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            if result.get('Status') == 'Success':
                session_id = result.get('Details', '')
                return {"success": True, "session_id": session_id, "message": "OTP sent successfully"}
            else:
                return {"success": False, "session_id": None, "message": result.get('Details', 'Unknown error')}
    except HTTPError as e:
        body = e.read().decode('utf-8') if hasattr(e, 'read') else ''
        return {"success": False, "session_id": None, "message": f"HTTP {e.code}: {body or e.reason}"}
    except URLError as e:
        return {"success": False, "session_id": None, "message": f"Network error: {e.reason}"}
    except Exception as e:
        return {"success": False, "session_id": None, "message": str(e)}


def verify_otp_via_2factor(session_id: str, otp: str) -> dict:
    """Verify OTP against a 2factor.in session. Returns {success, message}."""
    api_key = ENV.get('TWO_FACTOR_API_KEY', '')
    if not api_key:
        return {"success": False, "message": "2factor.in API key not configured"}

    url = f"https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp}"
    try:
        req = Request(url, method='GET')
        with urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            if result.get('Status') == 'Success' and result.get('Details') == 'OTP Matched':
                return {"success": True, "message": "OTP verified successfully"}
            else:
                return {"success": False, "message": result.get('Details', 'OTP did not match')}
    except HTTPError as e:
        body = e.read().decode('utf-8') if hasattr(e, 'read') else ''
        return {"success": False, "message": f"HTTP {e.code}: {body or e.reason}"}
    except URLError as e:
        return {"success": False, "message": f"Network error: {e.reason}"}
    except Exception as e:
        return {"success": False, "message": str(e)}




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
                    conn.close()

            self.send_json_response(200, {"success": True, "source": "Store", "data": BACKUP_STORE["counters"]})
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
                    conn.close()

            self.send_json_response(200, {"success": True, "source": "Store", "data": BACKUP_STORE["tokens"]})
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
                    conn.close()

            self.send_json_response(200, {"success": True, "source": "Store", "data": BACKUP_STORE["alerts"]})
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

        if path == '/api/send-otp':
            mobile = data.get('mobile', '').strip()
            if not mobile or not mobile.isdigit() or len(mobile) != 10:
                self.send_json_response(400, {"success": False, "message": "Invalid mobile number. Must be 10 digits."})
                return

            result = send_otp_via_2factor(mobile)

            if result['success']:
                # Store the session_id returned by 2factor.in
                OTP_STORE[mobile] = {
                    'session_id': result['session_id'],
                    'expiry': time.time() + OTP_EXPIRY_SECONDS
                }
                print(f"[OTP] Sent to +91-{mobile}, session: {result['session_id']}")
                self.send_json_response(200, {"success": True, "message": f"OTP sent to +91 XXXXX{mobile[-4:]}"})
            else:
                print(f"[OTP ERROR] {result['message']}")
                self.send_json_response(500, {"success": False, "message": result['message']})
            return

        if path == '/api/verify-otp':
            mobile = data.get('mobile', '').strip()
            otp_input = data.get('otp', '').strip()

            entry = OTP_STORE.get(mobile)
            if not entry:
                self.send_json_response(400, {"success": False, "message": "No OTP found for this number. Please request a new OTP."})
                return

            if time.time() > entry['expiry']:
                OTP_STORE.pop(mobile, None)
                self.send_json_response(400, {"success": False, "message": "OTP has expired. Please request a new one."})
                return

            # Verify via 2factor.in
            verify_result = verify_otp_via_2factor(entry['session_id'], otp_input)

            if verify_result['success']:
                OTP_STORE.pop(mobile, None)  # One-time use
                print(f"[OTP] Verified for +91-{mobile}")
                self.send_json_response(200, {"success": True, "message": "OTP verified successfully"})
            else:
                self.send_json_response(400, {"success": False, "message": verify_result['message']})
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

            self.send_json_response(201, {"success": True, "token": token_record})
            return

        elif path == '/api/tokens/call':
            counter_id = int(data.get('counterId', 1))
            token_id = data.get('tokenId')

            # Update in-memory backup store
            # Mark previous serving token at this counter as completed
            for t in BACKUP_STORE["tokens"]:
                if t.get("counterId") == counter_id and t.get("status") == "SERVING":
                    t["status"] = "COMPLETED"
            # Set the called token as serving
            if token_id:
                for t in BACKUP_STORE["tokens"]:
                    if t.get("id") == token_id:
                        t["status"] = "SERVING"
                        t["counterId"] = counter_id
            # Update counter status
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

            self.send_json_response(200, {"success": True, "counterId": counter_id, "calledToken": token_id})
            return

        elif path == '/api/tokens/complete':
            counter_id = int(data.get('counterId', 1))
            
            # Update in-memory backup store
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
            
            # Update backup store
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

            self.send_json_response(200, {"success": True, "message": "System reset to fresh shift"})
            return

        self.send_json_response(404, {"error": "Endpoint not found"})

def run_server(port=None):
    if port is None:
        port = int(os.environ.get('PORT', 8080))
    server_address = ('0.0.0.0', port)
    httpd = ThreadingHTTPServer(server_address, RobustDakHandler)
    conn = get_db()
    is_mysql = conn is not None
    if conn: conn.close()

    print("=" * 65)
    print(f"[OK] DakDrishti 4.0 Server running at http://0.0.0.0:{port}")
    print(f"[DB] MySQL Connection: {'CONNECTED to ' + ENV['DB_NAME'] if is_mysql else 'Standby / Resilient Memory Mode'}")
    print(f"[HOST] Database Host: {ENV['DB_HOST']}:{ENV['DB_PORT']} (User: {ENV['DB_USER']})")
    print("=" * 65)
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
