/**
 * HFF Dashboard login — Supabase email auth or env-based admin password.
 */

function getNextUrl() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
        return next;
    }
    return "/dashboard";
}

function showError(message) {
    const box = document.getElementById("login-error");
    const text = document.getElementById("login-error-text");
    if (!box || !text) return;
    text.textContent = message;
    box.classList.remove("hidden");
}

function hideError() {
    document.getElementById("login-error")?.classList.add("hidden");
}

function setLoading(loading) {
    const btn = document.getElementById("btn-login");
    const label = document.getElementById("btn-login-label");
    const spinner = document.getElementById("btn-login-spinner");
    if (!btn) return;
    btn.disabled = loading;
    if (label) label.textContent = loading ? "Signing in…" : "Sign in";
    spinner?.classList.toggle("hidden", !loading);
}

async function initSupabase() {
    try {
        const res = await fetch("/api/config");
        const cfg = await res.json();
        if (cfg.supabase_url && cfg.supabase_anon_key && window.supabase) {
            return window.supabase.createClient(cfg.supabase_url, cfg.supabase_anon_key);
        }
    } catch (e) {
        console.warn("Supabase unavailable", e);
    }
    return null;
}

async function establishServerSession(body) {
    const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || "Sign in failed");
    }
    return data;
}

async function checkAlreadyLoggedIn() {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    const data = await res.json();
    if (data.authenticated) {
        window.location.href = getNextUrl();
    }
}

function setupPasswordToggle() {
    document.querySelectorAll(".login-toggle-pw").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-target");
            const input = document.getElementById(id);
            if (!input) return;
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            const icon = btn.querySelector(".material-symbols-outlined");
            if (icon) icon.textContent = show ? "visibility_off" : "visibility";
        });
    });
}

async function configureAuthMode() {
    const res = await fetch("/api/auth/mode");
    const mode = await res.json();
    const emailWrap = document.getElementById("field-email-wrap");
    const pwWrap = document.getElementById("field-password-wrap");
    const pwOnly = document.getElementById("field-password-only");
    const forgot = document.getElementById("link-forgot");

    if (mode.auth_mode === "password") {
        emailWrap?.classList.add("hidden");
        pwWrap?.classList.add("hidden");
        pwOnly?.classList.remove("hidden");
        forgot?.classList.add("hidden");
        document.getElementById("login-password-admin")?.setAttribute("required", "");
    } else if (mode.auth_mode === "none") {
        window.location.href = getNextUrl();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupPasswordToggle();
    checkAlreadyLoggedIn().catch(() => {});
    configureAuthMode().catch(() => {});

    document.getElementById("link-forgot")?.addEventListener("click", (e) => {
        e.preventDefault();
        showError(
            "Contact your administrator to reset your password in Supabase Auth."
        );
    });

    document.getElementById("login-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();
        setLoading(true);

        try {
            const modeRes = await fetch("/api/auth/mode");
            const mode = await modeRes.json();

            if (mode.auth_mode === "password") {
                const password = document.getElementById("login-password-admin")?.value || "";
                await establishServerSession({ password });
                window.location.href = getNextUrl();
                return;
            }

            const email = document.getElementById("login-email")?.value?.trim();
            const password = document.getElementById("login-password")?.value || "";
            if (!email || !password) {
                showError("Please enter your email and password.");
                return;
            }

            const client = await initSupabase();
            if (!client) {
                showError(
                    "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY, or use DASHBOARD_PASSWORD for local admin login."
                );
                return;
            }

            const { data, error } = await client.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw new Error(error.message);

            const remember = document.getElementById("login-remember")?.checked;
            if (remember && data.session) {
                await client.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
            }

            await establishServerSession({
                access_token: data.session?.access_token,
            });
            window.location.href = getNextUrl();
        } catch (err) {
            showError(err.message || "Could not sign in. Please try again.");
        } finally {
            setLoading(false);
        }
    });
});
