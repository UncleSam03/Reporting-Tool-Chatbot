/**
 * Support Group Reporting Chatbot - Interactive Dashboard Layer
 * Designed to perfectly support neomorphic micro-animations, dropdowns, and embedded chatbot modal.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Setup interactive top bar buttons
    initTopbarActions();
    
    // Setup embedded chatbot modal for New Report button
    initNewReportModal();

    // Setup quarter selection dropdown
    initQuarterSelector();

    // Setup expandable details panel
    initExpandableDetails();

    // Listen for custom Vercel / dynamic script loaded states
    initPageAnimations();
});

function currentQuarterOptions() {
    const year = new Date().getFullYear();
    const q = Math.floor((new Date().getMonth()) / 3) + 1;
    const options = [`Q${q} ${year}`];
    for (let i = 1; i <= 3; i++) {
        let nq = q - i;
        let ny = year;
        while (nq < 1) {
            nq += 4;
            ny -= 1;
        }
        options.push(`Q${nq} ${ny}`);
    }
    options.push("All-Time");
    return options;
}

/**
 * Setup period filtering (uses live Supabase/API data on overview page)
 */
function initQuarterSelector() {
    const periodBtn = document.getElementById("btn-period-select");
    const periodLabel = document.getElementById("period-label");
    if (!periodBtn || !periodLabel) return;

    const dropdown = document.createElement("div");
    dropdown.className = "absolute right-0 mt-2 w-48 rounded-2xl neo-card z-50 hidden flex flex-col gap-2 p-3";
    dropdown.style.top = "100%";
    periodBtn.parentElement.style.position = "relative";
    periodBtn.parentElement.appendChild(dropdown);

    currentQuarterOptions().forEach((q) => {
        const item = document.createElement("button");
        item.className = "text-left px-4 py-2 rounded-xl text-sm text-on-surface-variant hover:text-primary hover:neo-pressed transition-all";
        item.textContent = q;
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            periodLabel.dataset.selectedPeriod = q === "All-Time" ? "" : q;
            periodLabel.innerHTML = `<span class="material-symbols-outlined text-[16px]">calendar_today</span> ${q}`;
            dropdown.classList.add("hidden");
            if (window.applyOverviewFilters) {
                const period = q === "All-Time" ? undefined : q;
                window.applyOverviewFilters({ period }).catch((err) => console.error(err));
            }
        });
        dropdown.appendChild(item);
    });

    periodBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllPopovers(dropdown);
        dropdown.classList.toggle("hidden");
    });
}

/**
 * Top bar popups (Notifications, Calendar, Filter, Profile)
 */
function initTopbarActions() {
    // 1. Notifications
    const notifBtn = document.getElementById("btn-topbar-notifications");
    if (notifBtn) {
        const notifDropdown = document.createElement("div");
        notifDropdown.className = "absolute right-0 mt-3 w-80 rounded-2xl neo-card z-50 hidden p-4 flex flex-col gap-3";
        notifDropdown.style.top = "100%";
        notifBtn.style.position = "relative";
        notifBtn.appendChild(notifDropdown);

        notifDropdown.innerHTML = `
            <div class="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                <span class="font-bold text-on-surface">Notifications</span>
                <button id="btn-clear-notifs" class="text-xs text-primary hover:underline">Clear All</button>
            </div>
            <div class="flex flex-col gap-3 max-h-64 overflow-y-auto" id="notif-list">
                <div class="flex gap-2 items-start text-xs text-on-surface-variant py-1">
                    <span class="text-emerald-500 font-bold">●</span>
                    <div>
                        <p class="font-semibold text-on-surface">New report compiled!</p>
                        <p>Facilitator David Mutua submitted a new report for Machakos.</p>
                        <p class="text-[10px] text-outline mt-0.5">5 mins ago</p>
                    </div>
                </div>
                <div class="flex gap-2 items-start text-xs text-on-surface-variant py-1">
                    <span class="text-emerald-500 font-bold">●</span>
                    <div>
                        <p class="font-semibold text-on-surface">Supabase Cloud Sync Successful</p>
                        <p>All database records synchronized perfectly with remote tables.</p>
                        <p class="text-[10px] text-outline mt-0.5">2 hours ago</p>
                    </div>
                </div>
            </div>
        `;

        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeAllPopovers(notifDropdown);
            notifDropdown.classList.toggle("hidden");
        });

        const clearBtn = notifDropdown.querySelector("#btn-clear-notifs");
        clearBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const list = notifDropdown.querySelector("#notif-list");
            list.innerHTML = `<div class="py-4 text-center text-outline text-xs">No new notifications.</div>`;
            const badge = document.getElementById("notification-badge");
            if (badge) badge.style.display = "none";
        });
    }

    // 2. Profile
    const profileBtn = document.getElementById("btn-topbar-profile");
    if (profileBtn) {
        const profileDropdown = document.createElement("div");
        profileDropdown.className = "absolute right-0 mt-3 w-56 rounded-2xl neo-card z-50 hidden p-4 flex flex-col gap-2";
        profileDropdown.style.top = "100%";
        profileBtn.style.position = "relative";
        profileBtn.appendChild(profileDropdown);

        const displayEmail = window.__dashboardUser || "Signed in";
        profileDropdown.innerHTML = `
            <div class="border-b border-outline-variant/30 pb-2 mb-1">
                <p class="font-bold text-on-surface text-sm">Admin</p>
                <p class="text-xs text-outline" id="profile-user-email">${displayEmail}</p>
            </div>
            <a href="/" class="text-xs text-left px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:neo-pressed transition-all">Open Chatbot Simulator</a>
            <button class="text-xs text-left px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:neo-pressed transition-all">Export Settings</button>
            <button type="button" id="btn-sign-out" class="text-xs text-left px-3 py-2 rounded-xl text-error hover:neo-pressed transition-all mt-1">Sign Out</button>
        `;

        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeAllPopovers(profileDropdown);
            profileDropdown.classList.toggle("hidden");
        });

        profileDropdown.querySelector("#btn-sign-out")?.addEventListener("click", (e) => {
            e.stopPropagation();
            if (window.dashboardSignOut) {
                window.dashboardSignOut();
            } else {
                window.location.href = "/login";
            }
        });
    }

    // 3. Filters
    const filterBtn = document.getElementById("btn-topbar-filter");
    if (filterBtn) {
        const filterDropdown = document.createElement("div");
        filterDropdown.className = "absolute right-0 mt-3 w-64 rounded-2xl neo-card z-50 hidden p-4 flex flex-col gap-3";
        filterDropdown.style.top = "100%";
        filterBtn.style.position = "relative";
        filterBtn.appendChild(filterDropdown);

        filterDropdown.innerHTML = `
            <span class="font-bold text-sm text-on-surface">Filter Dashboard</span>
            <div class="flex flex-col gap-1">
                <label class="text-xs text-outline font-semibold mb-1">Select Location:</label>
                <select id="select-dashboard-location" class="bg-background neomorph-inset border-none rounded-xl px-3 py-2 text-xs font-medium text-on-surface focus:ring-0 transition-all cursor-pointer">
                    <option>All Locations</option>
                    <option>Machakos</option>
                    <option>Kiambu</option>
                    <option>Eldoret</option>
                    <option>Malindi</option>
                    <option>Kisumu</option>
                </select>
            </div>
            <button id="btn-apply-filters" class="w-full neo-extruded text-primary font-label text-[11px] font-semibold py-2 px-3 rounded-lg hover:neo-pressed transition-all mt-1">
                Apply Filters
            </button>
        `;

        filterBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeAllPopovers(filterDropdown);
            filterDropdown.classList.toggle("hidden");
        });

        const applyBtn = filterDropdown.querySelector("#btn-apply-filters");
        applyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            filterDropdown.classList.add("hidden");
            const selectVal = filterDropdown.querySelector("#select-dashboard-location").value;
            if (window.applyOverviewFilters) {
                const periodLabel = document.getElementById("period-label");
                const period = periodLabel?.dataset?.selectedPeriod || undefined;
                window
                    .applyOverviewFilters({
                        period,
                        town: selectVal === "All Locations" ? undefined : selectVal,
                    })
                    .catch((err) => console.error(err));
            }
        });
    }

    // 4. Calendar Button popup
    const calBtn = document.getElementById("btn-topbar-calendar");
    if (calBtn) {
        const calDropdown = document.createElement("div");
        calDropdown.className = "absolute right-0 mt-3 w-56 rounded-2xl neo-card z-50 hidden p-4 flex flex-col gap-2";
        calDropdown.style.top = "100%";
        calBtn.style.position = "relative";
        calBtn.appendChild(calDropdown);

        calDropdown.innerHTML = `
            <span class="font-bold text-sm text-on-surface">Time Period</span>
            <button class="text-xs text-left px-3 py-2 rounded-xl text-on-surface-variant bg-primary/10 text-primary neo-pressed">Last 3 Months (Default)</button>
            <button class="text-xs text-left px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:neo-pressed transition-all">Last 6 Months</button>
            <button class="text-xs text-left px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:neo-pressed transition-all">Full Year 2024</button>
        `;

        calBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeAllPopovers(calDropdown);
            calDropdown.classList.toggle("hidden");
        });
    }

    // Global body click to hide dropdowns
    document.addEventListener("click", () => {
        closeAllPopovers();
    });
}

function closeAllPopovers(except = null) {
    const popovers = [
        document.querySelector("#btn-period-select + div"),
        document.querySelector("#btn-topbar-notifications > div"),
        document.querySelector("#btn-topbar-profile > div"),
        document.querySelector("#btn-topbar-filter > div"),
        document.querySelector("#btn-topbar-calendar > div")
    ];
    popovers.forEach(p => {
        if (p && p !== except) {
            p.classList.add("hidden");
        }
    });
}

/**
 * Expandable Details toggle
 */
function initExpandableDetails() {
    const btn = document.getElementById("btn-toggle-details");
    const details = document.getElementById("details-section");
    const icon = document.getElementById("toggle-details-icon");
    const text = document.getElementById("toggle-details-text");
    if (!btn || !details) return;

    btn.addEventListener("click", () => {
        if (details.classList.contains("hidden")) {
            // Expand
            details.classList.remove("hidden");
            setTimeout(() => {
                details.style.height = "auto";
                details.style.opacity = "1";
                details.classList.remove("h-0");
            }, 10);
            icon.textContent = "expand_less";
            text.textContent = "Hide Detailed Logs & Challenges";
        } else {
            // Collapse
            details.style.height = "0px";
            details.style.opacity = "0";
            details.classList.add("h-0");
            setTimeout(() => {
                details.classList.add("hidden");
            }, 500);
            icon.textContent = "expand_more";
            text.textContent = "Show Detailed Logs & Challenges";
        }
    });
}

/**
 * "+ New Report" Chatbot Modal Popup Overlay
 */
function initNewReportModal() {
    const newReportBtns = document.querySelectorAll("button");
    let newReportBtn = null;
    
    // Find the New Report button based on text
    newReportBtns.forEach(b => {
        if (b.textContent.includes("New Report")) {
            newReportBtn = b;
        }
    });

    if (!newReportBtn) return;

    // Create Modal container
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "chatbot-modal-overlay";
    modalOverlay.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] hidden flex items-center justify-center p-4 transition-all duration-300 opacity-0";
    
    modalOverlay.innerHTML = `
        <div class="relative neo-card w-full max-w-[440px] h-[780px] p-0 overflow-hidden flex flex-col scale-95 transition-transform duration-300">
            <!-- Modal Header -->
            <div class="px-6 py-4 flex justify-between items-center bg-slate-950 text-white z-50 shadow-md">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-[20px]">chat</span>
                    <span class="font-bold text-sm tracking-wide">WhatsApp Reporting Simulator</span>
                </div>
                <button id="btn-close-chatbot" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
            <!-- Chatbot Iframe -->
            <iframe src="/" class="flex-1 w-full border-none" style="height: calc(100% - 52px);"></iframe>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Setup events
    newReportBtn.addEventListener("click", () => {
        modalOverlay.classList.remove("hidden");
        setTimeout(() => {
            modalOverlay.classList.remove("opacity-0");
            modalOverlay.querySelector(".relative").classList.remove("scale-95");
        }, 10);
    });

    const closeBtn = modalOverlay.querySelector("#btn-close-chatbot");
    const closeModal = () => {
        modalOverlay.querySelector(".relative").classList.add("scale-95");
        modalOverlay.classList.add("opacity-0");
        setTimeout(() => {
            modalOverlay.classList.add("hidden");
            
            // Dynamic refresh of Overview dashboard numbers after completing report!
            if (window.loadOverview) {
                window.loadOverview().catch(e => console.error(e));
            }
        }, 300);
    };

    closeBtn.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

/**
 * Premium slide-in micro-animations on load
 */
function initPageAnimations() {
    const cards = document.querySelectorAll(".neo-card");
    cards.forEach((card, idx) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        setTimeout(() => {
            card.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, 100 * idx);
    });
}
