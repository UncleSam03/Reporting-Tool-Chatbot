import traceback
import sys
import os

# Add the parent directory to sys.path so we can import app_main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app_main import app
except Exception as e:
    import flask
    app = flask.Flask(__name__)
    error_msg = traceback.format_exc()
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return f"<pre>Initialization Error:\n{error_msg}</pre>", 500
