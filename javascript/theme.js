// ================= THEME MANAGER =================
const THEME_KEY = "bw-theme";

const ICONS = { light: "ri-sun-line", dark: "ri-moon-line", auto: "ri-computer-line" };
const LABELS = { light: "Light", dark: "Dark", auto: "Auto" };

let currentTheme = localStorage.getItem(THEME_KEY) || "auto";

/* ---------- core apply ---------- */
function applyTheme(theme) {
    const isDark =
        theme === "dark" ||
        (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.body.classList.toggle("dark-mode", isDark);

    // Update ALL themeIcon / themeLabel elements on the page
    document.querySelectorAll("#themeIcon").forEach(el => el.className = ICONS[theme]);
    document.querySelectorAll("#themeLabel").forEach(el => el.textContent = LABELS[theme]);

    // Mark active option in BOTH the landing dropdown AND the dashboard modal
    document.querySelectorAll(".theme-option").forEach(opt => {
        const isActive = opt.getAttribute("data-t") === theme;
        opt.classList.toggle("active", isActive);
        const check = opt.querySelector(".check");
        if (check) check.style.display = isActive ? "inline-block" : "none";
    });
}

/* ---------- set & persist ---------- */
function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    closeLandingDropdown();
    closeThemeModal();
}

/* ================================================
   LANDING PAGE — simple dropdown (#themeDropdown)
   ================================================ */
function openLandingDropdown() {
    const dd = document.getElementById("themeDropdown");
    if (dd) dd.classList.add("open");
}

function closeLandingDropdown() {
    const dd = document.getElementById("themeDropdown");
    if (dd) dd.classList.remove("open");
}

/* ================================================
   DASHBOARD — modal overlay (#themeModal)
   ================================================ */
function openThemeModal() {
    const modal = document.getElementById("themeModal");
    if (modal) modal.classList.add("show");
}

function closeThemeModal() {
    const modal = document.getElementById("themeModal");
    if (modal) modal.classList.remove("show");
}

/* ---------- system preference listener ---------- */
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentTheme === "auto") applyTheme("auto");
});

/* Run immediately so there's no flash of wrong theme */
applyTheme(currentTheme);

/* ---------- wire up events after DOM is ready ---------- */
document.addEventListener("DOMContentLoaded", () => {

    /* ── LANDING PAGE: #themeBtn toggles #themeDropdown ── */
    const themeBtn = document.getElementById("themeBtn");
    const themeDropdown = document.getElementById("themeDropdown");

    if (themeBtn && themeDropdown) {
        themeBtn.addEventListener("click", e => {
            e.stopPropagation();
            themeDropdown.classList.toggle("open");
        });

        // Close when clicking outside
        document.addEventListener("click", e => {
            if (!themeBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
                closeLandingDropdown();
            }
        });
    }

    /* ── DASHBOARD: #themeWrapper (inside sidebar dropdown) opens modal ── */
    const themeWrapper = document.getElementById("themeWrapper");
    if (themeWrapper && !themeBtn) {
        // Only attach this if we're NOT on the landing page (no #themeBtn present)
        themeWrapper.addEventListener("click", e => {
            e.stopPropagation();
            openThemeModal();
        });
    }

    /* Dashboard modal close button */
    const closeBtn = document.getElementById("closeThemeModal");
    if (closeBtn) closeBtn.addEventListener("click", closeThemeModal);

    /* Dashboard modal: click overlay to close */
    const themeModal = document.getElementById("themeModal");
    if (themeModal) {
        themeModal.addEventListener("click", e => {
            if (e.target === themeModal) closeThemeModal();
        });
    }

    /* Escape closes either UI */
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeLandingDropdown();
            closeThemeModal();
        }
    });

    /* ALL .theme-option clicks (landing dropdown + dashboard modal) */
    document.querySelectorAll(".theme-option").forEach(opt => {
        opt.addEventListener("click", () => setTheme(opt.getAttribute("data-t")));
    });

    /* Legacy toggle button (if used elsewhere) */
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const isDark =
                currentTheme === "dark" ||
                (currentTheme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
            setTheme(isDark ? "light" : "dark");
        });
    }

    /* Re-apply to sync icon/label after full DOM load */
    applyTheme(currentTheme);
});

/* Expose helpers globally */
window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.openLandingDropdown = openLandingDropdown;
window.closeLandingDropdown = closeLandingDropdown;
window.setTheme = setTheme;
