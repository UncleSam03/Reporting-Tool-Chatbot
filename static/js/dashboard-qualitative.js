async function loadQualitative() {
    const data = await fetchJson("/api/dashboard/qualitative");
    showDataSource(data.source);

    const tracker = document.getElementById("qualitative-tracker");
    if (!tracker) return;

    const entries = data.entries || [];
    if (!entries.length) {
        tracker.innerHTML = `<p class="text-on-surface-variant text-sm px-2">No qualitative data yet.</p>`;
        return;
    }

    tracker.innerHTML = entries
        .map(
            (e) => `
        <div class="neo-extruded rounded-xl p-5 mb-4">
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-semibold text-on-surface">${escapeHtml(e.town)} — ${escapeHtml(e.facilitator)}</h4>
                <span class="text-label-sm text-on-surface-variant">${escapeHtml(e.month)} · Met: ${escapeHtml(e.met_status)}</span>
            </div>
            ${e.lessons ? `<p class="text-sm mb-3"><span class="font-bold text-primary">Engagement:</span> ${escapeHtml(e.lessons)}</p>` : ""}
            <p class="text-xs font-bold text-error mb-1 uppercase">Challenges</p>
            <p class="text-sm mb-2">${(e.challenges || []).length ? e.challenges.map((c) => escapeHtml(c)).join(", ") : "None"}${e.challenges_other ? ` (${escapeHtml(e.challenges_other)})` : ""}</p>
            <p class="text-xs font-bold text-status-success mb-1 uppercase">Resolved</p>
            <p class="text-sm mb-2">${escapeHtml(e.resolved) || "—"}</p>
            <p class="text-xs font-bold text-on-surface-variant mb-1 uppercase">Unresolved ideas</p>
            <p class="text-sm">${escapeHtml(e.unresolved) || "—"}</p>
        </div>`
        )
        .join("");
}

document.addEventListener("DOMContentLoaded", () => {
    loadQualitative().catch((e) => console.error(e));
});
