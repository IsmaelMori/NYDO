// Declaramos las variables globales que siempre están en el HTML principal
const menuBtn = document.getElementById("menuBtn");
const pageOverlay = document.getElementById("pageOverlay");
const sidebar = document.getElementById("sidebar");

function openMenu() {
    sidebar.classList.add("open");
    pageOverlay.classList.add("visible");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
}

function closeMenu() {
    sidebar.classList.remove("open");
    pageOverlay.classList.remove("visible");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
}

// Evento del botón hamburguesa principal
if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }
    });
}

if (pageOverlay) {
    pageOverlay.addEventListener("click", closeMenu);
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeMenu();
    }
});

// Inicialización al cargar el DOM y los componentes externos
document.addEventListener("DOMContentLoaded", () => {
    const includes = document.querySelectorAll("[data-include]");
    
    Promise.all([...includes].map(el => {
        const file = el.getAttribute("data-include");
        return fetch(file)
            .then(res => {
                if (res.ok) return res.text();
                throw new Error("Error cargando " + file);
            })
            .then(html => {
                el.innerHTML = html;
            });
    })).then(() => {
        // === AQUÍ YA SE CARGÓ EL SIDEBAR.HTML ===

        // 1. Vinculamos el botón de cierre que viene de sidebar.html
        const closeBtn = document.getElementById("closeBtn");
        if (closeBtn) {
            closeBtn.addEventListener("click", closeMenu);
        }

        // 2. Vinculamos los enlaces de navegación del sidebar
        const navLinks = document.querySelectorAll(".sidebar .nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                navLinks.forEach(item => item.classList.remove("active"));
                link.classList.add("active");
                closeMenu();
            });
        });

        // 3. Destacar enlace según la página actual
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            if (href && href.includes(currentPath)) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

    }).catch(err => console.error("Error al cargar componentes globales:", err));
});