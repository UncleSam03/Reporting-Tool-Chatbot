/**
 * HFF Dashboard — loads metrics from Supabase (browser) or Flask API (fallback).
 */

const CHALLENGE_LABELS = [
    "Attendance / Punctuality issues",
    "Lack of learning materials / manuals",
    "Venue availability or bad weather",
    "Disinterest / low participation from members",
    "Transportation constraints",
    "Healthcare or physical health barriers",
    "Other",
];

let supabaseClient = null;

function formatNumber(n) {
    return Number(n).toLocaleString();
}

function computeMetrics(reports) {
    const facilitators = new Set();
    const locations = new Set();
    let totalMale = 0;
    let totalFemale = 0;
    let meetingsHeld = 0;
    const challengeCounts = {};

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

    const groupsThisMonth = new Set();
    const groupsLastMonth = new Set();

    for (const report of reports) {
        const fac = (report.facilitator || "").trim();
        const town = (report.town_village || "").trim();
        if (fac) facilitators.add(fac.toLowerCase());
        if (town) locations.add(town.toLowerCase());

        if (report.met_status === "Yes") {
            meetingsHeld++;
            totalMale += report.attendees_male || 0;
            totalFemale += report.attendees_female || 0;
        }

        let challenges = report.challenges || [];
        if (typeof challenges === "string") {
            try { challenges = JSON.parse(challenges); } catch { challenges = []; }
        }
        for (const c of challenges) {
            challengeCounts[c] = (challengeCounts[c] || 0) + 1;
        }

        const created = report.created_at ? new Date(report.created_at) : null;
        const groupKey = `${fac}|${town}`.toLowerCase();
        if (created && created >= thisMonthStart) {
            groupsThisMonth.add(groupKey);
        } else if (created && created >= lastMonthStart && created <= lastMonthEnd) {
            groupsLastMonth.add(groupKey);
        }
    }

    const total = reports.length;
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    return {
        active_groups: facilitators.size,
        groups_trend: groupsThisMonth.size - groupsLastMonth.size,
        total_attendance: totalMale + totalFemale,
        attendees_male: totalMale,
        attendees_female: totalFemale,
        meeting_success_rate: total ? Math.round((meetingsHeld / total) * 100) : 0,
        active_locations: locations.size,
        period_label: `Q${quarter} ${now.getFullYear()}`,
        reports,
        challenges: challengeCounts,
    };
}

function renderKpis(data) {
    document.getElementById("kpi-active-groups").textContent = formatNumber(data.active_groups);
    document.getElementById("kpi-total-attendance").textContent = formatNumber(data.total_attendance);
    document.getElementById("kpi-male").textContent = `${formatNumber(data.attendees_male)} Male`;
    document.getElementById("kpi-female").textContent = `${formatNumber(data.attendees_female)} Female`;
    document.getElementById("kpi-success-rate").textContent = `${data.meeting_success_rate}%`;
    document.getElementById("kpi-success-bar").style.width = `${data.meeting_success_rate}%`;
    document.getElementById("kpi-locations").textContent = formatNumber(data.active_locations);
    document.getElementById("period-label").innerHTML =
        `<span class="material-symbols-outlined text-[16px]">calendar_today</span> ${data.period_label}`;

    const trendEl = document.getElementById("kpi-groups-trend");
    const trend = data.groups_trend;
    const sign = trend >= 0 ? "+" : "";
    const arrow = trend >= 0 ? "arrow_upward" : "arrow_downward";
    const color = trend >= 0 ? "text-status-success" : "text-error";
    trendEl.className = `text-label-sm font-label ${color} flex items-center gap-1`;
    trendEl.innerHTML = `
        <span class="material-symbols-outlined text-[14px]">${arrow}</span>
        <span>${sign}${trend} from last month</span>
    `;
}

function renderChallenges(challengeCounts) {
    const list = document.getElementById("challenges-list");
    const items = CHALLENGE_LABELS.map((name) => ({
        name,
        count: challengeCounts[name] || 0,
    })).sort((a, b) => b.count - a.count);

    const max = Math.max(...items.map((i) => i.count), 1);

    if (!items.some((i) => i.count > 0)) {
        list.innerHTML = `<p class="text-label-sm text-on-surface-variant">No challenge data yet. Complete reports via the chatbot.</p>`;
        return;
    }

    list.innerHTML = items
        .map((item) => {
            const pct = Math.round((item.count / max) * 100);
            return `
                <div>
                    <div class="flex justify-between text-label-sm mb-1">
                        <span class="text-on-surface-variant">${item.name}</span>
                        <span class="text-primary font-semibold tabular-nums">${item.count}</span>
                    </div>
                    <div class="w-full neo-pressed rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        })
        .join("");
}

function renderReportsTable(reports) {
    const tbody = document.getElementById("reports-table-body");

    if (!reports || reports.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center py-10 text-on-surface-variant">
                <div class="flex flex-col items-center gap-2">
                    <span class="material-symbols-outlined text-3xl">inbox</span>
                    <span class="font-medium">No reports yet</span>
                    <span class="text-label-sm">Submit reports via the <a href="/" class="text-primary underline">chatbot simulator</a>.</span>
                </div>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = reports
        .map((r) => {
            const date = r.created_at
                ? new Date(r.created_at).toLocaleDateString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                  })
                : "—";
            const total = (r.attendees_male || 0) + (r.attendees_female || 0);
            const metClass = r.met_status === "Yes" ? "badge-yes" : "badge-no";
            const testimony = r.add_testimony === "Yes" ? "Yes" : "No";
            return `
                <tr>
                    <td class="text-on-surface-variant tabular-nums">${date}</td>
                    <td class="font-medium">${r.facilitator || "—"}</td>
                    <td>${r.town_village || "—"}</td>
                    <td class="text-primary font-medium">${r.month || "—"}</td>
                    <td class="${metClass}">${r.met_status || "—"}</td>
                    <td class="tabular-nums font-medium">${total}</td>
                    <td>${testimony}</td>
                </tr>
            `;
        })
        .join("");
}

function showBanner(message, isError = false) {
    const banner = document.getElementById("status-banner");
    banner.textContent = message;
    banner.classList.remove("hidden");
    if (isError) {
        banner.classList.add("text-error");
    }
}

async function fetchViaApi() {
    const res = await fetch("/api/dashboard/metrics");
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

async function fetchViaSupabase() {
    const { data, error } = await supabaseClient
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return computeMetrics(data || []);
}

async function loadDashboard() {
    try {
        let metrics;

        if (supabaseClient) {
            metrics = await fetchViaSupabase();
            metrics.source = "supabase";
        } else {
            metrics = await fetchViaApi();
        }

        renderKpis(metrics);
        renderChallenges(metrics.challenges || {});
        renderReportsTable(metrics.reports || []);

        if (metrics.source === "sqlite") {
            showBanner("Using local SQLite data. Add SUPABASE_URL and keys to .env for cloud sync.");
        } else if (metrics.source === "supabase") {
            document.getElementById("status-banner").classList.add("hidden");
        }
    } catch (err) {
        console.error(err);
        showBanner(`Failed to load dashboard: ${err.message}`, true);
        document.getElementById("reports-table-body").innerHTML = `
            <tr><td colspan="7" class="text-center py-8 text-error">Could not load data. Check Supabase config and RLS policies.</td></tr>`;
    }
}

async function init() {
    try {
        const configRes = await fetch("/api/config");
        const config = await configRes.json();

        if (config.supabase_url && config.supabase_anon_key) {
            supabaseClient = window.supabase.createClient(
                config.supabase_url,
                config.supabase_anon_key
            );
        }
    } catch {
        /* Flask API fallback only */
    }

    await loadDashboard();
    document.getElementById("btn-refresh").addEventListener("click", loadDashboard);
}

init();
