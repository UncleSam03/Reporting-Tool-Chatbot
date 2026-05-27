let overviewCache = { reports: [], source: "sqlite" };

function parseQuarterLabel(label) {
    const m = String(label || "").match(/^Q([1-4])\s+(\d{4})$/);
    if (!m) return null;
    return { quarter: parseInt(m[1], 10), year: parseInt(m[2], 10) };
}

function reportInQuarter(report, quarter, year) {
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;
    const created = report.created_at ? new Date(report.created_at) : null;
    if (!created || Number.isNaN(created.getTime())) return false;
    const y = created.getFullYear();
    const mo = created.getMonth();
    return y === year && mo >= startMonth && mo <= endMonth;
}

function filterReports(reports, { period, town } = {}) {
    let filtered = reports.slice();
    const q = parseQuarterLabel(period);
    if (q) {
        filtered = filtered.filter((r) => reportInQuarter(r, q.quarter, q.year));
    }
    if (town && town !== "All Locations") {
        const t = town.toLowerCase();
        filtered = filtered.filter(
            (r) => (r.town_village || "").toLowerCase() === t
        );
    }
    return filtered;
}

function computeOverviewKpis(reports) {
    if (!reports.length) {
        return {
            active_groups: 0,
            groups_trend: 0,
            total_attendance: 0,
            attendees_male: 0,
            attendees_female: 0,
            meeting_success_rate: 0,
            active_locations: 0,
            challenges: {},
        };
    }

    const facilitators = new Set();
    const locations = new Set();
    let totalMale = 0;
    let totalFemale = 0;
    let meetingsHeld = 0;
    const challengeCounts = {};

    for (const report of reports) {
        const fac = (report.facilitator || "").trim();
        const town = (report.town_village || "").trim();
        if (fac) facilitators.add(fac.toLowerCase());
        if (town) locations.add(town.toLowerCase());

        if (report.met_status === "Yes") {
            meetingsHeld += 1;
            totalMale += report.attendees_male || 0;
            totalFemale += report.attendees_female || 0;
        }

        let challenges = report.challenges || [];
        if (typeof challenges === "string") {
            try {
                challenges = JSON.parse(challenges);
            } catch {
                challenges = [];
            }
        }
        if (Array.isArray(challenges)) {
            for (const c of challenges) {
                challengeCounts[c] = (challengeCounts[c] || 0) + 1;
            }
        }
    }

    const successRate = Math.round((meetingsHeld / reports.length) * 100);

    return {
        active_groups: facilitators.size,
        groups_trend: 0,
        total_attendance: totalMale + totalFemale,
        attendees_male: totalMale,
        attendees_female: totalFemale,
        meeting_success_rate: successRate,
        active_locations: locations.size,
        challenges: challengeCounts,
    };
}

function renderOverview(data) {
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

    renderChallenges(data.challenges || {});
    renderReportsTable(data.reports || []);
}

async function loadOverview(filters = {}) {
    const data = await fetchJson("/api/dashboard/metrics");
    overviewCache = {
        reports: data.reports || [],
        source: data.source,
        period_label: data.period_label,
        groups_trend: data.groups_trend,
    };

    const periodEl = document.getElementById("period-label");
    const period =
        filters.period ||
        periodEl?.dataset?.selectedPeriod ||
        data.period_label;
    const town = filters.town;

    const filtered = filterReports(overviewCache.reports, { period, town });
    const kpis = computeOverviewKpis(filtered);

    renderOverview({
        ...kpis,
        groups_trend: overviewCache.groups_trend,
        source: overviewCache.source,
        reports: filtered,
        period_label: period,
    });

    populateLocationFilter(overviewCache.reports);

    if (periodEl && (period || data.period_label)) {
        const label = period || data.period_label;
        periodEl.dataset.selectedPeriod = label === "All-Time" ? "" : label;
        periodEl.innerHTML = `<span class="material-symbols-outlined text-[16px]">calendar_today</span> ${label}`;
    }
}

function applyOverviewFilters(filters) {
    return loadOverview(filters);
}

window.loadOverview = loadOverview;
window.applyOverviewFilters = applyOverviewFilters;

function populateLocationFilter(reports) {
    const select = document.getElementById("select-dashboard-location");
    if (!select) return;
    const towns = [
        ...new Set(
            (reports || [])
                .map((r) => (r.town_village || "").trim())
                .filter(Boolean)
        ),
    ].sort();
    const current = select.value;
    select.innerHTML =
        '<option>All Locations</option>' +
        towns.map((t) => `<option>${escapeHtml(t)}</option>`).join("");
    if (towns.includes(current)) select.value = current;
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

function formatLessonsInteresting(text) {
    if (!text) return "—";

    const audioRegex = /(?:\(Audio\)\s*)?(https?:\/\/[^\s"]+\.(?:ogg|mp3|wav|m4a|aac))/i;
    const match = text.match(audioRegex);

    if (match) {
        const audioUrl = match[1];
        let cleanText = text.replace(audioRegex, '').trim();
        cleanText = cleanText.replace(/^["\s]+/, '').replace(/["\s]+$/, '').trim();

        let html = '';
        if (cleanText) {
            html += `<div class="text-xs text-on-surface-variant mb-1 truncate max-w-[150px]" title="${escapeHtml(cleanText)}">"${escapeHtml(cleanText)}"</div>`;
        }
        html += `
        <div class="flex items-center gap-2 max-w-[200px]">
            <audio controls class="w-24 h-6 rounded-md outline-none" src="${escapeHtml(audioUrl)}"></audio>
            <a href="/api/convert-to-mp3?url=${encodeURIComponent(audioUrl)}" 
               class="neo-extruded hover:neo-pressed p-1 rounded text-primary flex items-center justify-center transition-all duration-200" 
               title="Download MP3"
               download>
                <span class="material-symbols-outlined text-[12px] font-bold">download</span>
            </a>
        </div>`;
        return html;
    }

    return `<div class="truncate max-w-[180px] text-xs" title="${escapeHtml(text)}">${escapeHtml(text)}</div>`;
}

function renderReportsTable(reports) {
    const tbody = document.getElementById("reports-table-body");
    if (!tbody) return;
    if (!reports.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-on-surface-variant">No reports yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = reports
        .map((r) => {
            const date = r.created_at
                ? new Date(r.created_at).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
                : "—";
            const total = (r.attendees_male || 0) + (r.attendees_female || 0);
            const metClass = r.met_status === "Yes" ? "text-status-success font-semibold" : "text-error font-semibold";
            return `<tr><td class="text-on-surface-variant">${date}</td><td class="font-medium">${escapeHtml(r.facilitator)}</td><td>${escapeHtml(r.town_village)}</td><td class="text-primary font-medium">${escapeHtml(r.month)}</td><td class="${metClass}">${escapeHtml(r.met_status)}</td><td class="tabular-nums font-medium">${total}</td><td>${r.add_testimony === "Yes" ? "Yes" : "No"}</td><td>${formatLessonsInteresting(r.lessons_interesting)}</td></tr>`;
        })
        .join("");
}

document.addEventListener("DOMContentLoaded", () => {
    loadOverview().catch((e) => console.error(e));
});
