import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports.db")

def seed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clean previous records if any
    cursor.execute("DROP TABLE IF EXISTS reports")
    
    # Create Table
    cursor.execute("""
        CREATE TABLE reports (
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
    
    reports = [
        (
            "sess_demo_1",
            "Mpho Lekone",
            "+267 71 234 567",
            "Maun",
            "Maun Community Hall",
            "Wednesday",
            "14:00",
            "April",
            "Yes",
            12,
            18,
            "We used interactive storybooks and divided participants into pairs for roleplay.",
            json.dumps(["Attendance / Punctuality issues", "Lack of learning materials / manuals"]),
            "",
            "Offered small refreshment incentives for early arrival.",
            "N/A",
            "Yes",
            "Felt isolated and had difficulty speaking in public settings.",
            "Built strong conversational confidence and developed peer support bonds.",
            "Yes",
            "I am capable of speaking my truth, I support my community"
        ),
        (
            "sess_demo_2",
            "Sarah Dube",
            "+267 72 345 678",
            "Gaborone",
            "Gaborone Public Library",
            "Monday",
            "10:00 AM",
            "May",
            "Yes",
            8,
            14,
            "Conducted peer reflections and standard Q&A with printed handouts.",
            json.dumps(["Lack of learning materials / manuals", "Other"]),
            "Power outage at the library venue during the meeting.",
            "Conducted the session outside in the library garden under the trees.",
            "N/A",
            "No",
            "",
            "",
            "No",
            ""
        ),
        (
            "sess_demo_3",
            "Kago Sebele",
            "+267 73 456 789",
            "Kanye",
            "Kanye Clinic Auditorium",
            "Friday",
            "15:30",
            "May",
            "No",
            0,
            0,
            "N/A - Did not meet",
            json.dumps(["Venue availability or bad weather"]),
            "",
            "N/A - Postponed to next month.",
            "Need to coordinate backup venue alternatives with the local clinic head.",
            "No",
            "",
            "",
            "No",
            ""
        )
    ]
    
    cursor.executemany("""
        INSERT INTO reports (
            session_id, facilitator, cell_num, town_village, location, 
            meeting_day, meeting_time, month, met_status, attendees_male, 
            attendees_female, lessons_interesting, challenges, challenges_other, 
            challenges_resolved, challenges_unresolved, add_testimony, testimony_before, 
            testimony_changes, testimony_affirmations_status, testimony_affirmations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, reports)
    
    conn.commit()
    conn.close()
    print("[OK] Seeding complete! 3 sample reports loaded in SQLite.")

if __name__ == "__main__":
    seed()
