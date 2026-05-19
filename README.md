# HFF Support Group Reporting Chatbot & Simulator

A rule-based monthly report compilation chatbot for support group facilitators, styled as an interactive **WhatsApp Simulator Web Dashboard**. It automates the process of completing monthly reports by converting them into a conversational questionnaire and dynamically generating the official Word report document upon completion.

---

## 🌟 Features

- **WhatsApp Chatbot Simulator**: A premium dark-mode mobile phone frame running a simulated WhatsApp chat interface.
- **Rule-Based State Machine**: Full implementation of the report's structure, including data validation (dates, integers, phone numbers) and interactive choice pills.
- **Branching Conversational Logic**: Smart conditional branches (e.g., if a facilitator didn't meet this month, the chatbot automatically skips attendance and lesson details and jumps directly to challenges).
- **Interactive Checkboxes**: Multi-select checkbox support for the challenges section, mirroring a modern checklist form.
- **Automated Document Generation**: Uses `python-docx` to instantly fill in the official `HFF SUPPORT GROUP REPORTING TOOL.docx` template with the collected answers and enables downloading the finalized `.docx` file immediately.
- **Live State Monitor**: A side-by-side developer console displaying the live JSON session state and real-time form field compilation status.

---

## 📸 Interface Design Preview

The dashboard features:
1. **Left Panel**: The smartphone frame containing the active chatbot window with quick-reply buttons and checklist overlays.
2. **Right Panel**: A live dashboard displaying compiled variables, active session state JSON, and the primary glowing download button that pulses when the report is ready.

---

## ⚙️ Setup & Running

This project is lightweight and written in Python utilizing standard libraries and standard web routing, meaning it can be run locally with minimal setup.

### 1. Prerequisites
Make sure you have Python 3 installed. Then, install the required packages:

```bash
pip install flask python-docx
```

### 2. Run the Application
Start the Flask local web server:

```bash
python app.py
```

### 3. Open in Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📂 Repository Structure

- `app.py`: Flask backend, session manager, input validators, state-machine flow, and `.docx` template filler.
- `index.html`: The HTML5/CSS3/JavaScript frontend single-page application.
- `HFF SUPPORT GROUP REPORTING TOOL.docx`: The official Microsoft Word report form template.
- `test_chatbot.py`: Sequential client-simulation test script to verify flow logic.
- `.gitignore`: Standard exclusion patterns.

---

## 🚀 Deploying to Live WhatsApp

To transition this simulator to a real, live-production WhatsApp chatbot:
1. **Meta Developer Account**: Set up a developer account at [developers.facebook.com](https://developers.facebook.com) and create a WhatsApp Business App.
2. **Configure Webhook**: Point Meta's webhook callback URL to a hosted instance of your Flask application (e.g., on Render, AWS, or Heroku).
3. **Verify Token**: Implement Meta's webhook verification route (GET request with `hub.challenge` and `hub.verify_token`).
4. **Map Inbound JSON**: Update the `/api/message` route in `app.py` to parse incoming JSON payloads from Meta's Webhook schema instead of the local simulator schema. Use the sender's phone number as the `session_id`.
5. **WhatsApp Media API**: When the questionnaire completes, save the `.docx` file, upload it using the WhatsApp Media API endpoint, and send a message containing the document's `media_id` back to the user.
