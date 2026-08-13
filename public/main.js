/* markuswaas.com — theme, scrollspy, reveal, mobile nav. No dependencies. */
(function () {
    "use strict";

    var root = document.documentElement;

    /* ------------------------------------------------------------------
       Theme toggle — follows the system until the visitor chooses.
       ------------------------------------------------------------------ */
    var THEME_COLORS = { light: "#FBF7F2", dark: "#211B16" };
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

    systemDark.addEventListener("change", function (e) {
        var stored = null;
        try {
            stored = localStorage.getItem("theme");
        } catch (err) {}
        if (stored !== "light" && stored !== "dark") {
            applyTheme(e.matches ? "dark" : "light");
        }
    });

    /* ------------------------------------------------------------------
       Mobile nav (disclosure)
       ------------------------------------------------------------------ */
    var rail = document.querySelector(".rail");
    var navToggle = document.querySelector(".nav-toggle");
    var siteNav = document.getElementById("site-nav");

    function setNav(open) {
        rail.classList.toggle("nav-open", open);
        navToggle.setAttribute("aria-expanded", String(open));
    }

    if (rail && navToggle && siteNav) {
        navToggle.addEventListener("click", function () {
            setNav(!rail.classList.contains("nav-open"));
        });

        siteNav.addEventListener("click", function (e) {
            if (e.target.closest("a")) setNav(false);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && rail.classList.contains("nav-open")) {
                setNav(false);
                navToggle.focus();
            }
        });
    }

    /* ------------------------------------------------------------------
       Scrollspy — highlight the section in the middle of the viewport
       ------------------------------------------------------------------ */
    var sections = document.querySelectorAll("main section[id]");
    var navLinks = document.querySelectorAll(".site-nav a[href^='#']");

    if ("IntersectionObserver" in window && sections.length && navLinks.length) {
        var spy = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    navLinks.forEach(function (link) {
                        if (link.getAttribute("href") === "#" + entry.target.id) {
                            link.setAttribute("aria-current", "true");
                        } else {
                            link.removeAttribute("aria-current");
                        }
                    });
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        sections.forEach(function (s) {
            spy.observe(s);
        });
    }

    /* ------------------------------------------------------------------
       Reveal on scroll — skipped entirely under reduced motion or no IO
       ------------------------------------------------------------------ */
    var motionOK = matchMedia("(prefers-reduced-motion: no-preference)").matches;

    if (motionOK && "IntersectionObserver" in window) {
        var targets = document.querySelectorAll(
            [
                ".hero .kicker", ".hero h1", ".hero-meta", ".hero .lead", ".social-row",
                ".section h2", ".section-lead",
                ".timeline > li", ".card", ".all-link",
                ".edu-entry", ".skill-group",
                "#interests p", ".awards-list li"
            ].join(",")
        );

        targets.forEach(function (el) {
            el.classList.add("reveal");
        });

        var revealer = new IntersectionObserver(
            function (entries) {
                var shown = 0;
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.style.transitionDelay = Math.min(shown * 70, 350) + "ms";
                    entry.target.classList.add("is-visible");
                    revealer.unobserve(entry.target);
                    shown++;
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
        );

        targets.forEach(function (el) {
            revealer.observe(el);
        });

        /* safety net: if observation never fires (prerender, exotic UAs),
           make sure nothing stays hidden */
        setTimeout(function () {
            targets.forEach(function (el) {
                el.classList.add("is-visible");
            });
        }, 3000);
    }

    /* ------------------------------------------------------------------
       Footer year
       ------------------------------------------------------------------ */
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
})();
