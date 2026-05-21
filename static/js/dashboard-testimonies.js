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
                ${t.affirmations ? `<div><p class="text-xs font-bold text-status-success uppercase mb-1">Affirmations</p><p class="text-on-surface italic">"${escapeHtml(t.affirmations)}"</p></div>` : ""}
            </div>
        </article>`
        )
        .join("");
}

document.addEventListener("DOMContentLoaded", () => {
    loadTestimonies().catch((e) => console.error(e));
});
