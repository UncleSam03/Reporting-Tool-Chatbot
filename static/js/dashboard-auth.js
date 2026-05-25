/**
 * Sign out helper for dashboard profile menu.
 */
async function dashboardSignOut() {
    try {
        const cfgRes = await fetch("/api/config");
        const cfg = await cfgRes.json();
        if (cfg.supabase_url && cfg.supabase_anon_key && window.supabase) {
            const client = window.supabase.createClient(
                cfg.supabase_url,
                cfg.supabase_anon_key
            );
            await client.auth.signOut();
        }
    } catch (e) {
        console.warn("Supabase sign out skipped", e);
    }
    await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
    });
    window.location.href = "/login";
}

window.dashboardSignOut = dashboardSignOut;
