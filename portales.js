/* Portales: brillo que sigue al puntero, ligera inclinación y entrada al hacer scroll */
(function () {
    var portals = document.querySelectorAll(".portal");
    if (!portals.length) return;

    document.documentElement.classList.add("portals-ready");
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { e.target.classList.toggle("is-in", e.isIntersecting); });
        }, { threshold: 0.15 });
        portals.forEach(function (p) { io.observe(p); });
    } else {
        portals.forEach(function (p) { p.classList.add("is-in"); });
    }

    if (reduce) return;

    portals.forEach(function (p) {
        var raf = 0, ev = null;

        function paint() {
            raf = 0;
            var r = p.getBoundingClientRect();
            var x = (ev.clientX - r.left) / r.width;
            var y = (ev.clientY - r.top) / r.height;
            p.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
            p.style.setProperty("--my", (y * 100).toFixed(1) + "%");
            p.style.setProperty("--ry", ((x - 0.5) * 5).toFixed(2) + "deg");
            p.style.setProperty("--rx", ((0.5 - y) * 4).toFixed(2) + "deg");
        }

        p.addEventListener("pointermove", function (e) {
            if (e.pointerType === "touch") return;
            ev = e;
            if (!raf) raf = requestAnimationFrame(paint);
        }, { passive: true });

        p.addEventListener("pointerleave", function () {
            p.style.setProperty("--rx", "0deg");
            p.style.setProperty("--ry", "0deg");
            p.style.setProperty("--mx", "50%");
            p.style.setProperty("--my", "0%");
        });
    });
})();