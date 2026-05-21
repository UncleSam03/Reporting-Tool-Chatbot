"""Supabase client helpers for reports storage and dashboard metrics."""

import json
import os
from datetime import datetime, timedelta

_client = None


def is_configured():
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def get_client():
    global _client
    if _client is not None:
        return _client
    if not is_configured():
        return None
    from supabase import create_client

    _client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )
    return _client


def _row_from_answers(session_id, answers):
    challenges = answers.get("challenges", [])
    if not isinstance(challenges, list):
        challenges = []
    return {
        "session_id": session_id,
        "facilitator": answers.get("facilitator"),
        "cell_num": answers.get("cell_num"),
        "town_village": answers.get("town_village"),
        "location": answers.get("location"),
        "meeting_day": answers.get("meeting_day"),
        "meeting_time": answers.get("meeting_time"),
        "month": answers.get("month"),
        "met_status": answers.get("met_status"),
        "attendees_male": answers.get("attendees_male") or 0,
        "attendees_female": answers.get("attendees_female") or 0,
        "lessons_interesting": answers.get("lessons_interesting"),
        "challenges": challenges,
        "challenges_other": answers.get("challenges_other"),
        "challenges_resolved": answers.get("challenges_resolved"),
        "challenges_unresolved": answers.get("challenges_unresolved"),
        "add_testimony": answers.get("add_testimony"),
        "testimony_before": answers.get("testimony_before"),
        "testimony_changes": answers.get("testimony_changes"),
        "testimony_affirmations_status": answers.get("testimony_affirmations_status"),
        "testimony_affirmations": answers.get("testimony_affirmations"),
    }


def save_report(session_id, answers):
    client = get_client()
    if not client:
        return False
    row = _row_from_answers(session_id, answers)
    client.table("reports").upsert(row, on_conflict="session_id").execute()
    return True


def get_all_reports():
    client = get_client()
    if not client:
        return []
    result = (
        client.table("reports")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def _parse_created_at(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def compute_metrics(reports):
    """Aggregate dashboard KPIs from report rows."""
    if not reports:
        return {
            "active_groups": 0,
            "groups_trend": 0,
            "total_attendance": 0,
            "attendees_male": 0,
            "attendees_female": 0,
            "meeting_success_rate": 0,
            "active_locations": 0,
            "period_label": _current_period_label(),
            "reports": [],
            "challenges": {},
        }

    facilitators = set()
    locations = set()
    total_male = 0
    total_female = 0
    meetings_held = 0
    challenge_counts = {}

    now = datetime.now()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = this_month_start - timedelta(seconds=1)
    last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    groups_this_month = set()
    groups_last_month = set()

    for report in reports:
        fac = (report.get("facilitator") or "").strip()
        town = (report.get("town_village") or "").strip()
        if fac:
            facilitators.add(fac.lower())
        if town:
            locations.add(town.lower())

        if report.get("met_status") == "Yes":
            meetings_held += 1
            total_male += report.get("attendees_male") or 0
            total_female += report.get("attendees_female") or 0

        challenges = report.get("challenges") or []
        if isinstance(challenges, str):
            try:
                challenges = json.loads(challenges)
            except json.JSONDecodeError:
                challenges = []
        for c in challenges:
            challenge_counts[c] = challenge_counts.get(c, 0) + 1

        created = _parse_created_at(report.get("created_at"))
        group_key = f"{fac}|{town}".lower()
        if created and created >= this_month_start:
            groups_this_month.add(group_key)
        elif created and last_month_start <= created <= last_month_end:
            groups_last_month.add(group_key)

    total_reports = len(reports)
    success_rate = round((meetings_held / total_reports) * 100) if total_reports else 0
    groups_trend = len(groups_this_month) - len(groups_last_month)

    return {
        "active_groups": len(facilitators),
        "groups_trend": groups_trend,
        "total_attendance": total_male + total_female,
        "attendees_male": total_male,
        "attendees_female": total_female,
        "meeting_success_rate": success_rate,
        "active_locations": len(locations),
        "period_label": _current_period_label(),
        "reports": reports,
        "challenges": challenge_counts,
    }


def _current_period_label():
    now = datetime.now()
    quarter = (now.month - 1) // 3 + 1
    return f"Q{quarter} {now.year}"


def get_dashboard_metrics():
    reports = get_all_reports()
    metrics = compute_metrics(reports)
    metrics["source"] = "supabase"
    return metrics
