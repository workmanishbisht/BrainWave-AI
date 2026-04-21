const THEME_KEY = "bw-theme";

const ICONS = { light: "ri-sun-line", dark: "ri-moon-line", auto: "ri-computer-line" };
const LABELS = { light: "Light", dark: "Dark", auto: "Auto" };

let currentTheme = localStorage.getItem(THEME_KEY) || "auto";

function applyTheme(theme) {
    const isDark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.body.classList.toggle("dark-mode", isDark);

    const themeIcon = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");
    const themeOptions = document.querySelectorAll(".theme-option");

    if (themeIcon) themeIcon.className = ICONS[theme];
    if (themeLabel) themeLabel.textContent = LABELS[theme];

    themeOptions.forEach(function (opt) {
        const isActive = opt.getAttribute("data-t") === theme;
        opt.classList.toggle("active", isActive);
        const check = opt.querySelector(".check");
        if (check) check.style.display = isActive ? "inline" : "none";
    });
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    closeThemeDropdown();
}

function toggleTheme() {
    const isDark = currentTheme === "dark" || (currentTheme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "light" : "dark");
}

function openThemeDropdown() {
    const themeDropdown = document.getElementById("themeDropdown");
    const themeBtn = document.getElementById("themeBtn");
    if (themeDropdown) themeDropdown.classList.add("open");
    if (themeBtn) themeBtn.classList.add("open");
}

function closeThemeDropdown() {
    const themeDropdown = document.getElementById("themeDropdown");
    const themeBtn = document.getElementById("themeBtn");
    if (themeDropdown) themeDropdown.classList.remove("open");
    if (themeBtn) themeBtn.classList.remove("open");
}

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (currentTheme === "auto") applyTheme("auto");
});

applyTheme(currentTheme);

document.addEventListener("DOMContentLoaded", function () {
    const themeBtn = document.getElementById("themeBtn");
    const themeOptions = document.querySelectorAll(".theme-option");
    const themeWrapper = document.getElementById("themeWrapper");
    const themeToggle = document.getElementById("themeToggle");

    if (themeBtn) {
        themeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const themeDropdown = document.getElementById("themeDropdown");
            themeDropdown?.classList.contains("open") ? closeThemeDropdown() : openThemeDropdown();
        });
    }

    themeOptions.forEach(function (opt) {
        opt.addEventListener("click", function () {
            setTheme(opt.getAttribute("data-t"));
        });
    });

    document.addEventListener("click", function (e) {
        if (themeWrapper && !themeWrapper.contains(e.target)) closeThemeDropdown();
    });

    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }

    applyTheme(currentTheme);
});
