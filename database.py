import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports.db")

def init_db():
    """Initializes the SQLite database and creates the reports table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE,
            facilitator TEXT,
            cell_num TEXT,
            town_village TEXT,
            location TEXT,
            meeting_day TEXT,
            meeting_time TEXT,
            month TEXT,
            met_status TEXT,
            attendees_male INTEGER,
            attendees_female INTEGER,
            lessons_interesting TEXT,
            challenges TEXT,
            challenges_other TEXT,
            challenges_resolved TEXT,
            challenges_unresolved TEXT,
            add_testimony TEXT,
            testimony_before TEXT,
            testimony_changes TEXT,
            testimony_affirmations_status TEXT,
            testimony_affirmations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    print("[OK] SQLite Database Initialized.")

def save_report(session_id, answers):
    """
    Inserts a new completed monthly report or updates an existing one for the session.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Store challenges list as a serialized JSON string
    challenges_val = answers.get("challenges", [])
    if isinstance(challenges_val, list):
        challenges_str = json.dumps(challenges_val)
    else:
        challenges_str = str(challenges_val)
        
    fields = [
        session_id,
        answers.get("facilitator"),
        answers.get("cell_num"),
        answers.get("town_village"),
        answers.get("location"),
        answers.get("meeting_day"),
        answers.get("meeting_time"),
        answers.get("month"),
        answers.get("met_status"),
        answers.get("attendees_male"),
        answers.get("attendees_female"),
        answers.get("lessons_interesting"),
        challenges_str,
        answers.get("challenges_other"),
        answers.get("challenges_resolved"),
        answers.get("challenges_unresolved"),
        answers.get("add_testimony"),
        answers.get("testimony_before"),
        answers.get("testimony_changes"),
        answers.get("testimony_affirmations_status"),
        answers.get("testimony_affirmations")
    ]
    
    try:
        cursor.execute("""
            INSERT INTO reports (
                session_id, facilitator, cell_num, town_village, location, 
                meeting_day, meeting_time, month, met_status, attendees_male, 
                attendees_female, lessons_interesting, challenges, challenges_other, 
                challenges_resolved, challenges_unresolved, add_testimony, testimony_before, 
                testimony_changes, testimony_affirmations_status, testimony_affirmations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                facilitator=excluded.facilitator,
                cell_num=excluded.cell_num,
                town_village=excluded.town_village,
                location=excluded.location,
                meeting_day=excluded.meeting_day,
                meeting_time=excluded.meeting_time,
                month=excluded.month,
                met_status=excluded.met_status,
                attendees_male=excluded.attendees_male,
                attendees_female=excluded.attendees_female,
                lessons_interesting=excluded.lessons_interesting,
                challenges=excluded.challenges,
                challenges_other=excluded.challenges_other,
                challenges_resolved=excluded.challenges_resolved,
                challenges_unresolved=excluded.challenges_unresolved,
                add_testimony=excluded.add_testimony,
                testimony_before=excluded.testimony_before,
                testimony_changes=excluded.testimony_changes,
                testimony_affirmations_status=excluded.testimony_affirmations_status,
                testimony_affirmations=excluded.testimony_affirmations
        """, fields)
        conn.commit()
        print(f"[OK] SQLite: Saved report data for session {session_id}")

        try:
            import supabase_db
            if supabase_db.is_configured():
                supabase_db.save_report(session_id, answers)
                print(f"[OK] Supabase: Synced report for session {session_id}")
        except Exception as supa_err:
            print(f"[WARN] Supabase sync skipped: {supa_err}")
    except Exception as e:
        print(f"[ERROR] SQLite Error saving report: {e}")
    finally:
        conn.close()

def get_dashboard_metrics():
    """Returns aggregated dashboard metrics, preferring Supabase when configured."""
    try:
        import supabase_db
        if supabase_db.is_configured():
            return supabase_db.get_dashboard_metrics()
    except Exception as e:
        print(f"[WARN] Supabase metrics fallback to SQLite: {e}")

    reports = get_all_reports()
    try:
        import supabase_db
        metrics = supabase_db.compute_metrics(reports)
        metrics["source"] = "sqlite"
        return metrics
    except Exception:
        return {
            "active_groups": 0,
            "groups_trend": 0,
            "total_attendance": 0,
            "attendees_male": 0,
            "attendees_female": 0,
            "meeting_success_rate": 0,
            "active_locations": 0,
            "period_label": "—",
            "reports": reports,
            "challenges": {},
            "source": "sqlite",
        }


def get_all_reports():
    """Fetches all submitted monthly reports from the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM reports ORDER BY created_at DESC")
        rows = cursor.fetchall()
        reports = []
        for row in rows:
            report_dict = dict(row)
            try:
                report_dict["challenges"] = json.loads(report_dict["challenges"])
            except Exception:
                pass
            reports.append(report_dict)
        return reports
    except Exception as e:
        print(f"[ERROR] SQLite Error fetching reports: {e}")
        return []
    finally:
        conn.close()

# Automatically initialize database when module is imported
init_db()
