function formatEngagement(text) {
    if (!text) return "—";

    const audioRegex = /(?:\(Audio\)\s*)?(https?:\/\/[^\s"]+\.(?:ogg|mp3|wav|m4a|aac))/i;
    const match = text.match(audioRegex);

    if (match) {
        const audioUrl = match[1];
        let cleanText = text.replace(audioRegex, '').trim();
        cleanText = cleanText.replace(/^["\s]+/, '').replace(/["\s]+$/, '').trim();

        let html = '';
        if (cleanText) {
            html += `<p class="text-sm mb-3"><span class="font-bold text-primary">Engagement:</span> "${escapeHtml(cleanText)}"</p>`;
        }

        html += `
        <div class="mt-2 mb-3 p-4 rounded-xl neo-pressed bg-background/50 flex flex-col gap-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-lg" style="font-variation-settings: 'FILL' 1;">audiotrack</span>
                    <span class="text-xs font-semibold text-on-surface-variant font-body">Voice Engagement</span>
                </div>
                <a href="/api/convert-to-mp3?url=${encodeURIComponent(audioUrl)}" 
                   class="neo-extruded hover:neo-pressed text-[10px] font-bold text-primary px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all duration-200"
                   download>
                    <span class="material-symbols-outlined text-xs">download</span>
                    Download MP3
                </a>
            </div>
            <audio controls class="w-full h-8 rounded-lg outline-none" src="${escapeHtml(audioUrl)}"></audio>
        </div>`;
        return html;
    }

    return `<p class="text-sm mb-3"><span class="font-bold text-primary">Engagement:</span> ${escapeHtml(text)}</p>`;
}

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
            ${e.lessons ? formatEngagement(e.lessons) : ""}
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
