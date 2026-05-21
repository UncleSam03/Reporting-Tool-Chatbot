async function loadOverview() {
    const data = await fetchJson("/api/dashboard/metrics");
    showDataSource(data.source);

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set("kpi-active-groups", formatNumber(data.active_groups));
    set("kpi-total-attendance", formatNumber(data.total_attendance));
    set("kpi-male", `${formatNumber(data.attendees_male)} Male`);
    set("kpi-female", `${formatNumber(data.attendees_female)} Female`);
    set("kpi-success-rate", `${data.meeting_success_rate}%`);
    set("kpi-locations", formatNumber(data.active_locations));

    const bar = document.getElementById("kpi-success-bar");
    if (bar) bar.style.width = `${data.meeting_success_rate}%`;

    const trend = document.getElementById("kpi-groups-trend");
    if (trend) {
        const t = data.groups_trend || 0;
        const sign = t >= 0 ? "+" : "";
        const arrow = t >= 0 ? "arrow_upward" : "arrow_downward";
        const color = t >= 0 ? "text-status-success" : "text-error";
        trend.className = `text-label-sm font-label ${color} flex items-center gap-1`;
        trend.innerHTML = `<span class="material-symbols-outlined text-[14px]">${arrow}</span><span>${sign}${t} from last month</span>`;
    }

    const period = document.getElementById("period-label");
    if (period) {
        period.innerHTML = `<span class="material-symbols-outlined text-[16px]">calendar_today</span> ${data.period_label || ""}`;
    }

    renderChallenges(data.challenges || {});
    renderReportsTable(data.reports || []);
}

function renderChallenges(challengeCounts) {
    const list = document.getElementById("challenges-list");
    if (!list) return;
    const labels = [
        "Attendance / Punctuality issues",
        "Lack of learning materials / manuals",
        "Venue availability or bad weather",
        "Disinterest / low participation from members",
        "Transportation constraints",
        "Healthcare or physical health barriers",
        "Other",
    ];
    const items = labels.map((name) => ({ name, count: challengeCounts[name] || 0 }));
    const max = Math.max(...items.map((i) => i.count), 1);
    if (!items.some((i) => i.count > 0)) {
        list.innerHTML = `<p class="text-label-sm text-on-surface-variant">No challenge data yet.</p>`;
        return;
    }
    list.innerHTML = items
        .map((item) => {
            const pct = Math.round((item.count / max) * 100);
            return `<div><div class="flex justify-between text-label-sm mb-1"><span class="text-on-surface-variant">${item.name}</span><span class="text-primary font-semibold">${item.count}</span></div><div class="w-full neo-pressed rounded-full h-2"><div class="bg-primary h-2 rounded-full" style="width:${pct}%"></div></div></div>`;
        })
        .join("");
}

function renderReportsTable(reports) {
    const tbody = document.getElementById("reports-table-body");
    if (!tbody) return;
    if (!reports.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-on-surface-variant">No reports yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = reports
        .map((r) => {
            const date = r.created_at
                ? new Date(r.created_at).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
                : "—";
            const total = (r.attendees_male || 0) + (r.attendees_female || 0);
            const metClass = r.met_status === "Yes" ? "text-status-success font-semibold" : "text-error font-semibold";
            return `<tr><td class="text-on-surface-variant">${date}</td><td class="font-medium">${escapeHtml(r.facilitator)}</td><td>${escapeHtml(r.town_village)}</td><td class="text-primary font-medium">${escapeHtml(r.month)}</td><td class="${metClass}">${escapeHtml(r.met_status)}</td><td class="tabular-nums font-medium">${total}</td><td>${r.add_testimony === "Yes" ? "Yes" : "No"}</td></tr>`;
        })
        .join("");
}

document.addEventListener("DOMContentLoaded", () => {
    loadOverview().catch((e) => console.error(e));
});
