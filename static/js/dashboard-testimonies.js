function formatAffirmation(text) {
    if (!text) return "—";

    const audioRegex = /(?:\(Audio\)\s*)?(https?:\/\/[^\s"]+\.(?:ogg|mp3|wav|m4a|aac))/i;
    const match = text.match(audioRegex);

    if (match) {
        const audioUrl = match[1];
        let cleanText = text.replace(audioRegex, '').trim();
        cleanText = cleanText.replace(/^["\s]+/, '').replace(/["\s]+$/, '').trim();

        let html = '';
        if (cleanText) {
            html += `<p class="text-on-surface italic mb-3">"${escapeHtml(cleanText)}"</p>`;
        }

        html += `
        <div class="mt-3 p-4 rounded-xl neo-pressed bg-background/50 flex flex-col gap-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-lg" style="font-variation-settings: 'FILL' 1;">audiotrack</span>
                    <span class="text-xs font-semibold text-on-surface-variant font-body">Voice Testimony</span>
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

    return `<p class="text-on-surface italic">"${escapeHtml(text)}"</p>`;
}

async function loadTestimonies() {
    const data = await fetchJson("/api/dashboard/testimonies");
    showDataSource(data.source);

    const grid = document.getElementById("testimonies-grid");
    if (!grid) return;

    const items = data.testimonies || [];
    if (!items.length) {
        grid.innerHTML = `<div class="col-span-full neo-extruded rounded-xl p-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-4xl mb-2 block">volunteer_activism</span><p class="font-medium">No testimonies recorded yet</p><p class="text-label-sm mt-2">Complete a report with testimony enabled in the chatbot.</p></div>`;
        return;
    }

    grid.innerHTML = items
        .map(
            (t) => `
        <article class="neo-extruded rounded-2xl p-6 flex flex-col gap-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-on-surface">${escapeHtml(t.town)}</h3>
                    <p class="text-label-sm text-on-surface-variant">${escapeHtml(t.facilitator)} · ${escapeHtml(t.month)}</p>
                </div>
                <span class="neo-pressed px-3 py-1 rounded-full text-label-sm text-primary font-medium">Impact Story</span>
            </div>
            <div class="space-y-3 text-sm">
                <div><p class="text-xs font-bold text-on-surface-variant uppercase mb-1">Life Before</p><p class="text-on-surface">${escapeHtml(t.before) || "—"}</p></div>
                <div><p class="text-xs font-bold text-primary uppercase mb-1">Positive Changes</p><p class="text-on-surface">${escapeHtml(t.changes) || "—"}</p></div>
                ${t.affirmations ? `<div><p class="text-xs font-bold text-status-success uppercase mb-1">Affirmations</p>${formatAffirmation(t.affirmations)}</div>` : ""}
            </div>
        </article>`
        )
        .join("");
}

document.addEventListener("DOMContentLoaded", () => {
    loadTestimonies().catch((e) => console.error(e));
});
