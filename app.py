import os
import json
from flask import Flask, request, jsonify, render_template_string, send_from_directory, session, redirect, url_for, send_file
from dotenv import load_dotenv
import database
import dashboard_utils
import auth_utils

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "dev-change-me"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route("/")
def index():
    # Automatically redirect to /login instead of serving index.html
    return redirect(url_for("login_page"))

@app.route("/login")
def login_page():
    try:
        with open(os.path.join(BASE_DIR, "login.html"), "r", encoding="utf-8") as f:
            return f.read()
    except OSError as e:
        return f"Error loading login page: {e}", 500

@app.route("/api/auth/mode")
def auth_mode():
    if auth_utils.AUTH_DISABLED:
        return jsonify({"auth_mode": "none"})
    if os.getenv("SUPABASE_ANON_KEY"):
        return jsonify({"auth_mode": "supabase"})
    if auth_utils.ADMIN_PASSWORD:
        return jsonify({"auth_mode": "password"})
    return jsonify({"auth_mode": "supabase"})

@app.route("/api/auth/me")
def auth_me():
    return jsonify({
        "authenticated": auth_utils.is_authenticated(),
        "email": session.get("user_email"),
    })

@app.route("/api/auth/session", methods=["POST"])
def auth_session():
    data = request.get_json(silent=True) or {}
    access_token = data.get("access_token")
    password = data.get("password", "")

    if access_token:
        email = auth_utils.verify_supabase_access_token(access_token)
        if not email:
            return jsonify({"error": "Invalid or expired session. Please sign in again."}), 401
        auth_utils.establish_session(email)
        return jsonify({"ok": True, "email": email})

    if auth_utils.ADMIN_PASSWORD and password == auth_utils.ADMIN_PASSWORD:
        auth_utils.establish_session("admin")
        return jsonify({"ok": True, "email": "admin"})

    return jsonify({"error": "Invalid email or password."}), 401

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    auth_utils.clear_session()
    return jsonify({"ok": True})

@app.route("/dashboard")
@auth_utils.login_required
def dashboard():
    return render_template_string(
        dashboard_utils.render_dashboard_page("overview", "/dashboard")
    )

@app.route("/dashboard/group-metrics")
@auth_utils.login_required
def dashboard_group_metrics():
    return render_template_string(
        dashboard_utils.render_dashboard_page("group-metrics", "/dashboard/group-metrics")
    )

@app.route("/dashboard/testimonies")
@auth_utils.login_required
def dashboard_testimonies():
    return render_template_string(
        dashboard_utils.render_dashboard_page("testimonies", "/dashboard/testimonies")
    )

@app.route("/dashboard/qualitative")
@auth_utils.login_required
def dashboard_qualitative():
    return render_template_string(
        dashboard_utils.render_dashboard_page("qualitative", "/dashboard/qualitative")
    )

@app.route("/dashboard/settings")
@auth_utils.login_required
def dashboard_settings():
    return render_template_string(
        dashboard_utils.render_dashboard_page("settings", "/dashboard/settings")
    )

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(os.path.join(BASE_DIR, "static"), filename)

@app.route("/api/health")
def health():
    """Health check for Vercel and uptime monitors."""
    on_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
    supabase_browser = bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY"))
    supabase_server = bool(
        os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    return jsonify({
        "status": "ok",
        "vercel": on_vercel,
        "supabase_configured": supabase_browser,
        "supabase_server_configured": supabase_server,
        "dashboard_ready": supabase_server if on_vercel else True,
    })

@app.route("/api/config")
def api_config():
    """Public Supabase keys for browser client (anon key only)."""
    return jsonify({
        "supabase_url": os.getenv("SUPABASE_URL", ""),
        "supabase_anon_key": os.getenv("SUPABASE_ANON_KEY", ""),
    })

@app.route("/api/dashboard/metrics")
@auth_utils.api_login_required
def dashboard_metrics():
    """Aggregated KPIs — Supabase when configured, else SQLite."""
    return jsonify(database.get_dashboard_metrics())

@app.route("/api/dashboard/group-metrics")
@auth_utils.api_login_required
def api_group_metrics():
    return jsonify(database.get_group_metrics())

@app.route("/api/dashboard/testimonies")
@auth_utils.api_login_required
def api_testimonies():
    return jsonify(database.get_testimonies())

@app.route("/api/dashboard/qualitative")
@auth_utils.api_login_required
def api_qualitative():
    return jsonify(database.get_qualitative())

@app.route("/api/reports", methods=["GET"])
@auth_utils.api_login_required
def get_reports():
    """Return all completed reports — Supabase when configured, else SQLite."""
    reports, _source = database._fetch_reports()
    return jsonify(reports)

@app.route("/api/convert-to-mp3")
@auth_utils.login_required
def convert_to_mp3():
    url = request.args.get("url")
    if not url:
        return "Missing url parameter", 400
    if not url.startswith("http"):
        return "Invalid url", 400

    import requests
    import subprocess
    import tempfile
    
    try:
        response = requests.get(url, timeout=30)
        if response.status_code != 200:
            return f"Failed to fetch audio file: HTTP {response.status_code}", 500
        
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as temp_ogg:
            temp_ogg.write(response.content)
            ogg_path = temp_ogg.name

        mp3_path = ogg_path.replace(".ogg", ".mp3")

        try:
            cmd = ["ffmpeg", "-y", "-i", ogg_path, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_path]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

            filename = url.split("/")[-1].replace(".ogg", ".mp3")
            return send_file(
                mp3_path,
                mimetype="audio/mpeg",
                as_attachment=True,
                download_name=filename
            )
        finally:
            if os.path.exists(ogg_path):
                try:
                    os.remove(ogg_path)
                except OSError:
                    pass
            if os.path.exists(mp3_path):
                try:
                    os.remove(mp3_path)
                except OSError:
                    pass
    except Exception as e:
        return f"Error during audio conversion: {str(e)}", 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
