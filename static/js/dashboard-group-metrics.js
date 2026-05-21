async function loadGroupMetrics() {
    const data = await fetchJson("/api/dashboard/group-metrics");
    showDataSource(data.source);

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set("stat-total-groups", formatNumber(data.total_groups));
    set("stat-avg-attendance", `${data.avg_attendance_pct}%`);
    set("stat-total-facilitators", formatNumber(data.total_facilitators));
    set("stat-success-rate", `${data.success_rate}%`);

    const tbody = document.getElementById("groups-table-body");
    const footer = document.getElementById("groups-table-footer");
    if (!tbody) return;

    const groups = data.groups || [];
    if (!groups.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-8 py-10 text-center text-on-surface-variant">No group data yet. Submit reports via the chatbot.</td></tr>`;
        if (footer) footer.textContent = "Showing 0 groups";
        return;
    }

    tbody.innerHTML = groups
        .map((g) => {
            const barColor = g.success_rate >= 80 ? "bg-primary" : g.success_rate >= 60 ? "bg-amber-500" : "bg-error";
            const badgeColor =
                g.success_rate >= 80
                    ? "bg-emerald-100 text-emerald-700"
                    : g.success_rate >= 60
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700";
            return `<tr class="hover:bg-surface-container-lowest transition-colors">
                <td class="px-8 py-5"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-sm">groups</span></div><span class="font-medium text-on-surface">${escapeHtml(g.group_name)}</span></div></td>
                <td class="px-6 py-5 text-on-surface-variant font-medium">${escapeHtml(g.facilitator)}</td>
                <td class="px-6 py-5 text-on-surface-variant">${escapeHtml(g.town)}</td>
                <td class="px-6 py-5 text-sm font-medium">${g.male_total} / ${g.female_total}</td>
                <td class="px-6 py-5"><div class="w-24 bg-surface-container rounded-full h-2 overflow-hidden neo-pressed"><div class="${barColor} h-full rounded-full" style="width:${g.attendance_pct}%"></div></div><span class="text-[10px] font-bold mt-1 block">${g.attendance_pct}% Avg</span></td>
                <td class="px-8 py-5 text-right"><span class="px-3 py-1 rounded-full ${badgeColor} text-xs font-bold">${g.success_rate}%</span></td>
            </tr>`;
        })
        .join("");

    if (footer) footer.textContent = `Showing ${groups.length} group(s)`;
}

document.addEventListener("DOMContentLoaded", () => {
    loadGroupMetrics().catch((e) => console.error(e));
});
