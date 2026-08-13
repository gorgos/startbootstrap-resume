/* markuswaas.com — canvas market animation + micro-interactions. No dependencies. */
(function () {
    "use strict";

    var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = matchMedia("(pointer: fine)").matches;
    document.documentElement.classList.add("js");

    /* ------------------------------------------------------------------
       Hero name — split into per-letter spans for the staggered rise
       ------------------------------------------------------------------ */
    (function splitName() {
        var el = document.getElementById("hero-name");
        if (!el || reduceMotion) return;
        var words = el.textContent.trim().split(" ");
        el.textContent = "";
        var i = 0;
        words.forEach(function (word, w) {
            var wrap = document.createElement("span");
            wrap.className = "word";
            for (var c = 0; c < word.length; c++) {
                var ch = document.createElement("span");
                ch.className = "ch";
                ch.style.setProperty("--i", String(i++));
                ch.textContent = word[c];
                wrap.appendChild(ch);
            }
            el.appendChild(wrap);
            if (w < words.length - 1) el.appendChild(document.createTextNode(" "));
        });
    })();

    /* ------------------------------------------------------------------
       Market canvas — scrolling price line, volume bars, trade blips
       ------------------------------------------------------------------ */
    (function marketCanvas() {
        var canvas = document.getElementById("market-canvas");
        if (!canvas) return;
        var ctx = canvas.getContext("2d");
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W = 0, H = 0;
        var STEP = 7;               /* px between data points */
        var points = [];
        var offset = 0;             /* sub-step scroll position */
        var price = 64000;
        var momentum = 0;
        var blips = [];
        var pointer = { x: -1, y: -1 };
        var running = !reduceMotion;
        var visible = true;
        var raf = null;
        var last = 0;

        var ACCENT = "0, 229, 160";
        var RED = "255, 107, 107";

        function resize() {
            var rect = canvas.parentElement.getBoundingClientRect();
            W = Math.ceil(rect.width);
            H = Math.ceil(rect.height);
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = W + "px";
            canvas.style.height = H + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
            if (reduceMotion) draw(0);
        }

        function nextPrice() {
            momentum = momentum * 0.92 + (Math.random() - 0.5) * 120;
            if (Math.random() < 0.03) momentum += (Math.random() - 0.5) * 900; /* jump */
            price = Math.max(20000, price + momentum);
            return price;
        }

        function seed() {
            points = [];
            var n = Math.ceil(W / STEP) + 3;
            for (var i = 0; i < n; i++) points.push(nextPrice());
        }

        function yFor(v, min, range) {
            /* line lives in the middle band of the hero */
            var top = H * 0.18, bottom = H * 0.72;
            return bottom - ((v - min) / range) * (bottom - top);
        }

        function draw(dt) {
            ctx.clearRect(0, 0, W, H);

            /* grid */
            ctx.strokeStyle = "rgba(255,255,255,0.033)";
            ctx.lineWidth = 1;
            var g;
            for (g = 90 - (offset % 90); g < W; g += 90) {
                ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, H); ctx.stroke();
            }
            for (g = 90; g < H; g += 90) {
                ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(W, g); ctx.stroke();
            }

            var min = Infinity, max = -Infinity, i, v;
            for (i = 0; i < points.length; i++) {
                v = points[i];
                if (v < min) min = v;
                if (v > max) max = v;
            }
            var range = Math.max(max - min, 1200);
            min -= range * 0.12; range *= 1.24;

            /* faint price scale on the right */
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.font = "10px 'JetBrains Mono', monospace";
            ctx.textAlign = "right";
            for (g = 90; g < H - 60; g += 90) {
                var lv = min + ((H * 0.72 - g) / (H * 0.72 - H * 0.18)) * range;
                if (lv > 0) ctx.fillText(lv.toFixed(0), W - 14, g + 3);
            }

            /* volume bars along the bottom */
            for (i = 1; i < points.length; i++) {
                var d = points[i] - points[i - 1];
                var up = d >= 0;
                var h = Math.min(Math.abs(d) / range * H * 0.9, H * 0.09) + 2;
                ctx.fillStyle = "rgba(" + (up ? ACCENT : RED) + ", 0.10)";
                ctx.fillRect(i * STEP - offset, H - h - 12, Math.max(STEP - 2, 2), h);
            }

            /* area under the line */
            var grad = ctx.createLinearGradient(0, H * 0.18, 0, H * 0.8);
            grad.addColorStop(0, "rgba(" + ACCENT + ", 0.12)");
            grad.addColorStop(1, "rgba(" + ACCENT + ", 0)");
            ctx.beginPath();
            for (i = 0; i < points.length; i++) {
                v = yFor(points[i], min, range);
                if (i === 0) ctx.moveTo(i * STEP - offset, v);
                else ctx.lineTo(i * STEP - offset, v);
            }
            ctx.lineTo((points.length - 1) * STEP - offset, H);
            ctx.lineTo(-offset, H);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            /* the line — soft glow pass, then crisp pass */
            ctx.lineJoin = "round";
            function tracePath() {
                ctx.beginPath();
                for (var j = 0; j < points.length; j++) {
                    var y = yFor(points[j], min, range);
                    if (j === 0) ctx.moveTo(j * STEP - offset, y);
                    else ctx.lineTo(j * STEP - offset, y);
                }
            }
            tracePath();
            ctx.strokeStyle = "rgba(" + ACCENT + ", 0.16)";
            ctx.lineWidth = 6;
            ctx.stroke();
            tracePath();
            ctx.strokeStyle = "rgba(" + ACCENT + ", 0.85)";
            ctx.lineWidth = 1.6;
            ctx.stroke();

            /* leading dot + live price chip */
            var lx = (points.length - 1) * STEP - offset;
            var ly = yFor(points[points.length - 1], min, range);
            ctx.beginPath();
            ctx.arc(lx, ly, 3, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + ACCENT + ", 1)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(lx, ly, 9, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + ACCENT + ", 0.15)";
            ctx.fill();
            ctx.font = "11px 'JetBrains Mono', monospace";
            ctx.textAlign = "left";
            var label = points[points.length - 1].toFixed(2);
            var lw = ctx.measureText(label).width + 14;
            var chipX = Math.min(lx + 14, W - lw - 10);
            var chipY = Math.max(ly - 10, 16);
            ctx.fillStyle = "rgba(10,11,13,0.85)";
            ctx.strokeStyle = "rgba(" + ACCENT + ", 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(chipX, chipY - 9, lw, 19, 5);
            else ctx.rect(chipX, chipY - 9, lw, 19);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "rgba(" + ACCENT + ", 0.95)";
            ctx.fillText(label, chipX + 7, chipY + 4.5);

            /* trade blips */
            for (i = blips.length - 1; i >= 0; i--) {
                var b = blips[i];
                b.t += dt;
                var p = b.t / 1100;
                if (p >= 1) { blips.splice(i, 1); continue; }
                var bx = b.index * STEP - offset;
                if (bx < -20) { blips.splice(i, 1); continue; }
                var by = yFor(points[b.index] || points[points.length - 1], min, range);
                ctx.beginPath();
                ctx.arc(bx, by, 3 + p * 16, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(" + (b.up ? ACCENT : RED) + "," + (0.5 * (1 - p)) + ")";
                ctx.lineWidth = 1.25;
                ctx.stroke();
            }

            /* crosshair under the pointer */
            if (pointer.x >= 0 && finePointer) {
                var idx = Math.round((pointer.x + offset) / STEP);
                if (idx >= 0 && idx < points.length) {
                    var cy = yFor(points[idx], min, range);
                    var cx = idx * STEP - offset;
                    ctx.setLineDash([3, 5]);
                    ctx.strokeStyle = "rgba(255,255,255,0.14)";
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255,255,255,0.75)";
                    ctx.fill();
                    ctx.font = "10px 'JetBrains Mono', monospace";
                    ctx.textAlign = "center";
                    ctx.fillStyle = "rgba(255,255,255,0.4)";
                    ctx.fillText(points[idx].toFixed(2), cx, Math.max(cy - 14, 12));
                }
            }
        }

        function frame(ts) {
            if (!running || !visible) return;
            var dt = last ? Math.min(ts - last, 50) : 16;
            last = ts;
            offset += dt * 0.028; /* ~28px/s */
            while (offset >= STEP) {
                offset -= STEP;
                points.shift();
                points.push(nextPrice());
                blips.forEach(function (b) { b.index--; });
                if (Math.random() < 0.16) {
                    blips.push({
                        index: points.length - 1 - Math.floor(Math.random() * 24),
                        t: 0,
                        up: momentum >= 0
                    });
                }
            }
            draw(dt);
            raf = requestAnimationFrame(frame);
        }

        function start() {
            if (raf || !running || !visible) return;
            last = 0;
            raf = requestAnimationFrame(frame);
        }

        function stop() {
            if (raf) { cancelAnimationFrame(raf); raf = null; }
        }

        window.addEventListener("resize", resize);
        resize();

        if (!reduceMotion) {
            var hero = document.querySelector(".hero");
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) start(); else stop();
            }).observe(hero);

            document.addEventListener("visibilitychange", function () {
                if (document.hidden) stop(); else start();
            });

            hero.addEventListener("pointermove", function (e) {
                var r = canvas.getBoundingClientRect();
                pointer.x = e.clientX - r.left;
                pointer.y = e.clientY - r.top;
            });
            hero.addEventListener("pointerleave", function () {
                pointer.x = -1;
            });

            start();
        }
    })();

    /* ------------------------------------------------------------------
       Scroll reveals with per-batch stagger
       ------------------------------------------------------------------ */
    (function reveals() {
        var targets = document.querySelectorAll("main .rv");
        if (reduceMotion || !("IntersectionObserver" in window) || !targets.length) {
            targets.forEach(function (el) { el.classList.add("in"); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            var shown = 0;
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.style.setProperty("--d", Math.min(shown * 80, 400) + "ms");
                entry.target.classList.add("in");
                io.unobserve(entry.target);
                shown++;
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
        targets.forEach(function (el) { io.observe(el); });

        /* safety net: nothing stays hidden if observation never fires */
        setTimeout(function () {
            targets.forEach(function (el) { el.classList.add("in"); });
        }, 3000);
    })();

    /* ------------------------------------------------------------------
       Stat counters
       ------------------------------------------------------------------ */
    (function counters() {
        var counts = document.querySelectorAll(".count");
        if (!counts.length) return;

        function animate(el) {
            var target = parseFloat(el.getAttribute("data-count"));
            var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
            if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
            var t0 = null;
            var DUR = 1400;
            function tick(ts) {
                if (!t0) t0 = ts;
                var p = Math.min((ts - t0) / DUR, 1);
                var eased = 1 - Math.pow(1 - p, 4);
                el.textContent = (target * eased).toFixed(decimals);
                if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        if (!("IntersectionObserver" in window) || reduceMotion) {
            counts.forEach(animate);
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                animate(entry.target);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        counts.forEach(function (el) { io.observe(el); });
    })();

    /* ------------------------------------------------------------------
       Card spotlight — border glow follows the cursor
       ------------------------------------------------------------------ */
    if (finePointer && !reduceMotion) {
        document.querySelectorAll(".card").forEach(function (card) {
            card.addEventListener("pointermove", function (e) {
                var r = card.getBoundingClientRect();
                card.style.setProperty("--mx", (e.clientX - r.left) + "px");
                card.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }

    /* ------------------------------------------------------------------
       Cursor glow
       ------------------------------------------------------------------ */
    if (finePointer && !reduceMotion) {
        var glow = document.querySelector(".cursor-glow");
        if (glow) {
            var gx = innerWidth / 2, gy = innerHeight / 3;
            var tx = gx, ty = gy;
            var glowRaf = null;
            function glowStep() {
                gx += (tx - gx) * 0.09;
                gy += (ty - gy) * 0.09;
                glow.style.left = gx + "px";
                glow.style.top = gy + "px";
                if (Math.abs(tx - gx) > 0.3 || Math.abs(ty - gy) > 0.3) {
                    glowRaf = requestAnimationFrame(glowStep);
                } else {
                    glowRaf = null;
                }
            }
            window.addEventListener("pointermove", function (e) {
                document.body.classList.add("has-pointer");
                tx = e.clientX;
                ty = e.clientY;
                if (!glowRaf) glowRaf = requestAnimationFrame(glowStep);
            }, { passive: true });
        }
    }

    /* ------------------------------------------------------------------
       Magnetic buttons
       ------------------------------------------------------------------ */
    if (finePointer && !reduceMotion) {
        document.querySelectorAll("[data-magnetic]").forEach(function (el) {
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                var dx = e.clientX - (r.left + r.width / 2);
                var dy = e.clientY - (r.top + r.height / 2);
                el.style.transform = "translate(" + dx * 0.14 + "px," + dy * 0.22 + "px)";
            });
            el.addEventListener("pointerleave", function () {
                el.style.transform = "";
            });
        });
    }

    /* ------------------------------------------------------------------
       Nav background on scroll
       ------------------------------------------------------------------ */
    (function nav() {
        var el = document.getElementById("nav");
        if (!el) return;
        function onScroll() {
            el.classList.toggle("scrolled", scrollY > 24);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    })();

    /* ------------------------------------------------------------------
       Footer year
       ------------------------------------------------------------------ */
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
})();
