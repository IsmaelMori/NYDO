/* Brillo que sigue al puntero en la tarjeta (solo ratón) */
(function () {
    var c = document.querySelector(".soon-card");
    if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var raf = 0, e0;
    c.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        e0 = e;
        if (raf) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            var r = c.getBoundingClientRect();
            c.style.setProperty("--mx", ((e0.clientX - r.left) / r.width * 100).toFixed(1) + "%");
            c.style.setProperty("--my", ((e0.clientY - r.top) / r.height * 100).toFixed(1) + "%");
        });
    }, { passive: true });
})();