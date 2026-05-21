"""Load Stitch dashboard HTML pages and inject navigation + data scripts."""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PAGES_DIR = os.path.join(BASE_DIR, "dashboard", "pages")

NAV_ITEMS = [
    ("/dashboard", "Dashboard Overview", "dashboard"),
    ("/dashboard/group-metrics", "Group Metrics", "analytics"),
    ("/dashboard/testimonies", "Testimonies &amp; Impact", "volunteer_activism"),
    ("/dashboard/qualitative", "Qualitative Analysis", "psychology"),
    ("/dashboard/settings", "Settings/Exports", "settings_suggest"),
]

SCRIPT_BY_PAGE = {
    "overview": "dashboard-overview.js",
    "group-metrics": "dashboard-group-metrics.js",
    "testimonies": "dashboard-testimonies.js",
    "qualitative": "dashboard-qualitative.js",
    "settings": "dashboard-settings.js",
}

FILE_BY_PAGE = {
    "overview": "overview.html",
    "group-metrics": "group-metrics.html",
    "testimonies": "testimonies.html",
    "qualitative": "qualitative.html",
    "settings": "settings.html",
}


def _build_nav(active_href: str) -> str:
    items = []
    for href, label, icon in NAV_ITEMS:
        if href == active_href:
            cls = "neo-pressed text-primary font-bold flex items-center px-4 py-3 rounded-xl font-label text-label-md transition-colors duration-200"
        else:
            cls = "text-on-surface hover:text-primary flex items-center px-4 py-3 rounded-xl font-label text-label-md transition-all duration-200"
        items.append(
            f'<li><a class="{cls}" href="{href}">'
            f'<span class="material-symbols-outlined mr-3">{icon}</span>{label}</a></li>'
        )
    return '<ul class="flex-1 space-y-3 mt-4 px-4">' + "".join(items) + "</ul>"


def _inject_nav(html: str, active_href: str) -> str:
    nav = _build_nav(active_href)
    return re.sub(
        r"<ul class=\"flex-1 space-y-3 mt-4 px-4\">.*?</ul>",
        nav,
        html,
        count=1,
        flags=re.DOTALL,
    )


def _inject_scripts(html: str, page_key: str) -> str:
    script = SCRIPT_BY_PAGE[page_key]
    block = (
        '<div id="data-source-banner" class="hidden mx-margin-desktop mb-4 neo-pressed rounded-xl px-4 py-2 text-label-sm text-on-surface-variant"></div>'
        '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
        '<script src="/static/js/dashboard-common.js"></script>'
        f'<script src="/static/js/{script}"></script>'
    )
    if "</body>" in html:
        return html.replace("</body>", block + "\n</body>")
    return html + block


def render_dashboard_page(page_key: str, active_href: str) -> str:
    filename = FILE_BY_PAGE[page_key]
    path = os.path.join(PAGES_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()
    html = _inject_nav(html, active_href)
    html = _inject_scripts(html, page_key)
    return html
