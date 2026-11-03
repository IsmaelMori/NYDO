/* Comportamiento del dock móvil: centra el enlace activo y
   se esconde al bajar / reaparece al subir. */
(() => {
    const movil = window.matchMedia("(max-width: 768px)");
    let ultimoY = window.scrollY;

    // El sidebar se inyecta con data-include, así que esperamos a que exista
    function iniciar() {
        const sidebar = document.getElementById("sidebar");
        const activo = sidebar && sidebar.querySelector(".nav-link.active");
        if (!sidebar || !sidebar.querySelector(".nav-link")) return false;

        if (activo && movil.matches) {
            activo.scrollIntoView({ inline: "center", block: "nearest" });
        }

        window.addEventListener("scroll", () => {
            if (!movil.matches) return sidebar.classList.remove("dock-hidden");
            const y = window.scrollY;
            if (Math.abs(y - ultimoY) < 8) return;
            sidebar.classList.toggle("dock-hidden", y > ultimoY && y > 120);
            ultimoY = y;
        }, { passive: true });

        return true;
    }

    let intentos = 0;
    const espera = setInterval(() => {
        if (iniciar() || ++intentos > 40) clearInterval(espera);
    }, 150);
})();