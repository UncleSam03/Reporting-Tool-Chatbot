/**
 * Shared dashboard data layer — Supabase direct or Flask API fallback.
 */

let supabaseClient = null;

async function initSupabase() {
    if (supabaseClient) return supabaseClient;
    try {
        const res = await fetch("/api/config");
        const cfg = await res.json();
        if (cfg.supabase_url && cfg.supabase_anon_key && window.supabase) {
            supabaseClient = window.supabase.createClient(
                cfg.supabase_url,
                cfg.supabase_anon_key
            );
        }
    } catch (e) {
        console.warn("Supabase init skipped", e);
    }
    return supabaseClient;
}

async function fetchReports() {
    const client = await initSupabase();
    if (client) {
        const { data, error } = await client
            .from("reports")
            .select("*")
            .order("created_at", { ascending: false });
        if (!error && data) return { reports: data, source: "supabase" };
    }
    const res = await fetch("/api/reports");
    const reports = await res.json();
    return { reports: reports || [], source: "sqlite" };
}

async function fetchJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`API ${path} failed`);
    return res.json();
}

function formatNumber(n) {
    return Number(n || 0).toLocaleString();
}

function showDataSource(source) {
    const banner = document.getElementById("data-source-banner");
    if (!banner) return;
    if (source === "supabase") {
        banner.classList.add("hidden");
        return;
    }
    banner.textContent = `Data source: ${source}. Add Supabase keys to .env for cloud sync.`;
    banner.classList.remove("hidden");
}

function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text || "";
    return d.innerHTML;
}
