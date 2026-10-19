
const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const sidebar = document.getElementById("sidebar");
const pageOverlay = document.getElementById("pageOverlay");
const navLinks = document.querySelectorAll(".nav-link");

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

menuBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
        closeMenu();
    } else {
        openMenu();
    }
});

closeBtn.addEventListener("click", closeMenu);
pageOverlay.addEventListener("click", closeMenu);

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navLinks.forEach(item => item.classList.remove("active"));
        link.classList.add("active");
        closeMenu();
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeMenu();
    }
});
