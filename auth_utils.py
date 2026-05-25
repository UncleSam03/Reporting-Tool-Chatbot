"""Dashboard authentication — Flask session + optional Supabase JWT."""

import os
from functools import wraps

from flask import jsonify, redirect, request, session

AUTH_DISABLED = os.getenv("DASHBOARD_AUTH_DISABLED", "").lower() in (
    "1",
    "true",
    "yes",
)
ADMIN_PASSWORD = os.getenv("DASHBOARD_PASSWORD", "").strip()


def is_authenticated():
    if AUTH_DISABLED:
        return True
    return bool(session.get("dashboard_authenticated"))


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if is_authenticated():
            return view(*args, **kwargs)
        next_url = request.path
        if request.query_string:
            next_url += "?" + request.query_string.decode("utf-8")
        return redirect(f"/login?next={next_url}")

    return wrapped


def api_login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if is_authenticated():
            return view(*args, **kwargs)
        return jsonify({"error": "Authentication required"}), 401

    return wrapped


def verify_supabase_access_token(access_token):
    """Return user email if token is valid, else None."""
    if not access_token:
        return None
    url = os.getenv("SUPABASE_URL", "").strip()
    anon = os.getenv("SUPABASE_ANON_KEY", "").strip()
    if not url or not anon:
        return None
    try:
        import importlib
        import sys

        mod = sys.modules.get("supabase")
        if mod is not None and not hasattr(mod, "create_client"):
            del sys.modules["supabase"]
        create_client = importlib.import_module("supabase").create_client
        client = create_client(url, anon)
        res = client.auth.get_user(access_token)
        user = getattr(res, "user", None) if res else None
        if user and getattr(user, "email", None):
            return user.email
    except Exception as e:
        print(f"[WARN] Supabase token verification failed: {e}")
    return None


def establish_session(email=None):
    session["dashboard_authenticated"] = True
    session.permanent = True
    if email:
        session["user_email"] = email


def clear_session():
    session.pop("dashboard_authenticated", None)
    session.pop("user_email", None)
