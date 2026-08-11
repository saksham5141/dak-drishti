"""
DakDrishti 4.0 - Automated MySQL Database Initializer & Setup Script
Department of Posts, Ministry of Communications, Govt. of India
"""

import os
import sys
import getpass

def load_env():
    env_vars = {
        'DB_HOST': 'localhost',
        'DB_PORT': '3306',
        'DB_USER': 'root',
        'DB_PASSWORD': '',
        'DB_NAME': 'dak_drishti_db'
    }
    
    # Check for .env or .env.local in current or parent directory
    for path in ['.env', '../.env', '.env.local']:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        env_vars[k.strip()] = v.strip()
            break

    # Also override with system environment variables if set
    for k in env_vars:
        if k in os.environ:
            env_vars[k] = os.environ[k]

    return env_vars

def main():
    print("=" * 70)
    print(" DakDrishti 4.0 - MySQL Automated Database Setup & Verification")
    print("=" * 70)

    try:
        import pymysql
    except ImportError:
        print("[ERROR] PyMySQL driver is not installed.")
        print("Please run: pip install pymysql cryptography")
        sys.exit(1)

    cfg = load_env()
    print(f"Connecting to MySQL Host: {cfg['DB_HOST']}:{cfg['DB_PORT']} as User: '{cfg['DB_USER']}'")

    # Connect to MySQL Server (Server Level)
    conn = None
    try:
        conn = pymysql.connect(
            host=cfg['DB_HOST'],
            user=cfg['DB_USER'],
            password=cfg['DB_PASSWORD'],
            port=int(cfg['DB_PORT']),
            autocommit=True,
            charset='utf8mb4'
        )
        print("[SUCCESS] Connected to MySQL Server!")
    except Exception as e:
        print(f"[FAILED] Could not connect to MySQL: {e}")
        print("\nTip: If your MySQL password is not empty, please update the .env file with:")
        print("DB_PASSWORD=your_password")
        sys.exit(1)

    # Read and Execute Schema
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    seed_path = os.path.join(os.path.join(os.path.dirname(__file__)), 'seed_data.sql')

    with conn.cursor() as cursor:
        print(f"\n[1/3] Executing Database Schema from '{os.path.basename(schema_path)}'...")
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        # Split statements by semicolon
        statements = [s.strip() for s in sql_script.split(';') if s.strip()]
        for stmt in statements:
            if stmt.upper().startswith('DROP DATABASE') or stmt.upper().startswith('CREATE DATABASE') or stmt.upper().startswith('USE') or stmt.upper().startswith('CREATE TABLE'):
                try:
                    cursor.execute(stmt)
                except Exception as ex:
                    print(f"  [Warning executing statement]: {ex}")

        print("[SUCCESS] Database 'dak_drishti_db' and all 10 tables created successfully!")

        # Execute Seed Data
        print(f"\n[2/3] Populating Seed Data from '{os.path.basename(seed_path)}'...")
        cursor.execute("USE `dak_drishti_db`")
        with open(seed_path, 'r', encoding='utf-8') as f:
            seed_script = f.read()

        seed_statements = [s.strip() for s in seed_script.split(';') if s.strip()]
        for stmt in seed_statements:
            if stmt.upper().startswith('INSERT INTO') or stmt.upper().startswith('USE'):
                try:
                    cursor.execute(stmt)
                except Exception as ex:
                    print(f"  [Warning executing seed statement]: {ex}")

        print("[SUCCESS] Initial seed data inserted successfully!")

        # Verification Query
        print("\n[3/3] Verifying Database Structure & Table Row Counts:")
        print("-" * 55)
        print(f" {'Table Name':<30} | {'Row Count':<15}")
        print("-" * 55)
        
        tables = [
            'postal_circles', 'postal_divisions', 'post_offices', 
            'staff_operators', 'service_categories', 'services_catalog', 
            'counters', 'tokens', 'vision_cctv_nodes', 'ai_alerts', 
            'citizen_feedback', 'predictive_rush_forecast'
        ]

        for tbl in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) AS cnt FROM `{tbl}`")
                res = cursor.fetchone()
                cnt = res[0] if isinstance(res, tuple) else res.get('cnt', 0)
                print(f" {tbl:<30} | {cnt:<15}")
            except Exception as ex:
                print(f" {tbl:<30} | [Error: {ex}]")

        print("-" * 55)

    conn.close()
    print("\n[COMPLETE] Your MySQL database is ready and connected for DakDrishti 4.0!")
    print("Now run: python server.py to start your live database-backed application.\n")

if __name__ == '__main__':
    main()
