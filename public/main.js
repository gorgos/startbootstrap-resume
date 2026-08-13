/* markuswaas.com — theme toggle + footer year. No dependencies. */
(function () {
    "use strict";

    var root = document.documentElement;
    var THEME_COLORS = { light: "#FFFFFF", dark: "#0A0A0A" };
    var toggle = document.getElementById("theme-toggle");
    var metaTheme = document.getElementById("meta-theme-color");
    var systemDark = matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(theme) {
        root.dataset.theme = theme;
        if (metaTheme) metaTheme.setAttribute("content", THEME_COLORS[theme]);
        if (toggle) {
            toggle.setAttribute(
                "aria-label",
                theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            );
        }
    }

    applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

    if (toggle) {
        toggle.addEventListener("click", function () {
            var next = root.dataset.theme === "dark" ? "light" : "dark";
            applyTheme(next);
            try {
                localStorage.setItem("theme", next);
            } catch (e) {}
        });
    }

    /* follow live system changes until the visitor makes an explicit choice */
    systemDark.addEventListener("change", function (e) {
        var stored = null;
        try {
            stored = localStorage.getItem("theme");
        } catch (err) {}
        if (stored !== "light" && stored !== "dark") {
            applyTheme(e.matches ? "dark" : "light");
        }
    });

    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
})();
