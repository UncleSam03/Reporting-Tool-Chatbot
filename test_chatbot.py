import urllib.request
import json
import os

def send_message(session_id, message):
    url = "http://127.0.0.1:5000/api/message"
    data = json.dumps({"session_id": session_id, "message": message}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

def reset_session(session_id):
    url = "http://127.0.0.1:5000/api/reset"
    data = json.dumps({"session_id": session_id}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

def run_tests():
    session_id = "test_run_1"
    
    print("=== STARTING CHATBOT SIMULATION ===")
    
    # 1. Reset Session
    res = reset_session(session_id)
    print(f"Bot: {res.get('message')}\n")
    
    # 2. Sequential inputs representing a real support group facilitator report
    inputs = [
        "John Doe",                        # Facilitator Name
        "+27 82 123 4567",                 # Cell Number
        "Acornhoek",                       # Town/Village
        "Community Hall",                  # Specific Location
        "Wednesday",                       # Meeting Day (Choice)
        "14:00",                           # Meeting Time
        "May",                             # Month (Choice)
        "Yes",                             # Able to Meet (Choice - Yes branch)
        "8",                               # Male Attendees (Integer validation)
        "12",                              # Female Attendees (Integer validation)
        "Using interactive roleplays and visual maps.",  # How lessons interesting
        "1, 3",                            # Challenges (Multi-choice checklist: Attendance & Venue)
        "We rescheduled to later in the afternoon and met under a covered veranda.", # Challenges resolved
        "Getting more printed study booklets for the group.", # Unresolved ideas
        "Yes",                             # Add Testimony (Choice - Yes branch)
        "Participant felt isolated and lacked confidence.",  # Testimony life before
        "Participant started speaking in public and sharing ideas actively.", # Testimony changes
        "Yes",                             # Testimony affirmations status (Choice - Yes)
        "I am capable, I am strong, and I am a valuable member of my community." # Testimony affirmations list
    ]
    
    for i, inp in enumerate(inputs):
        print(f"User: {inp}")
        res = send_message(session_id, inp)
        if "error" in res:
            print(f"Error: {res['error']}")
            return
        
        bot_msg = res.get('message')
        print(f"Bot: {bot_msg}\n")
        
        # Check if completed
        if res.get('completed'):
            print("=== CONVERSATION COMPLETED SUCCESSFULLY ===")
            print(f"Final State Answers: {json.dumps(res['state']['answers'], indent=2)}")
            
            import tempfile
            output_file = os.path.join(tempfile.gettempdir(), "HFF_Support_Group_Report_Filled.docx")
            if os.path.exists(output_file):
                print(f"\n✓ SUCCESS: Generated report file found at: {output_file}")
                print(f"File size: {os.path.getsize(output_file)} bytes")
            else:
                print("\n❌ FAILED: Generated report file not found.")
            break

if __name__ == "__main__":
    import time
    # Wait a moment for server to initialize
    time.sleep(1)
    run_tests()
