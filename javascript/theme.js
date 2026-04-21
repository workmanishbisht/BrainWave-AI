// ================= THEME MANAGER =================
const THEME_KEY = "bw-theme";

const ICONS  = { light: "ri-sun-line",      dark: "ri-moon-line",  auto: "ri-computer-line" };
const LABELS = { light: "Light",            dark: "Dark",          auto: "Auto"             };

let currentTheme = localStorage.getItem(THEME_KEY) || "auto";

/* ---------- core apply ---------- */
function applyTheme(theme) {
    const isDark =
        theme === "dark" ||
        (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.body.classList.toggle("dark-mode", isDark);

    const themeIcon  = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");

    if (themeIcon)  themeIcon.className   = ICONS[theme];
    if (themeLabel) themeLabel.textContent = LABELS[theme];

    /* mark the active option in the modal */
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
    closeThemeModal();
}

/* ---------- open / close modal ---------- */
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

/* Run immediately (before DOMContentLoaded) so no flash */
applyTheme(currentTheme);

/* ---------- wire up events after DOM is ready ---------- */
document.addEventListener("DOMContentLoaded", () => {

    /* Theme wrapper button inside the dropdown opens the modal */
    const themeWrapper = document.getElementById("themeWrapper");
    if (themeWrapper) {
        themeWrapper.addEventListener("click", e => {
            e.stopPropagation();
            openThemeModal();
        });
    }

    /* Close button inside the modal */
    const closeBtn = document.getElementById("closeThemeModal");
    if (closeBtn) closeBtn.addEventListener("click", closeThemeModal);

    /* Click on overlay (outside modal box) closes it */
    const themeModal = document.getElementById("themeModal");
    if (themeModal) {
        themeModal.addEventListener("click", e => {
            if (e.target === themeModal) closeThemeModal();
        });
    }

    /* Escape key closes modal */
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeThemeModal();
    });

    /* Each theme option applies its theme */
    document.querySelectorAll(".theme-option").forEach(opt => {
        opt.addEventListener("click", () => setTheme(opt.getAttribute("data-t")));
    });

    /* Legacy toggle button support (if used on other pages) */
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) themeToggle.addEventListener("click", () => {
        const isDark =
            currentTheme === "dark" ||
            (currentTheme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        setTheme(isDark ? "light" : "dark");
    });

    /* Re-apply to sync icon / label after full DOM load */
    applyTheme(currentTheme);
});

/* Expose helpers globally */
window.openThemeModal  = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.setTheme        = setTheme;
