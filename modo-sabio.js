/* =========================================================
   modo-sabio.js  ·  NYDo Wiki
   1) Aparición suave de bloques
   2) Navegación por secciones (chip activo)
   3) Progreso personal (se guarda en el dispositivo)
   4) Videos: MP4 propio o enlace de YouTube
   5) Cronómetro de contraataque (6 s)
   6) Abrir el acordeón que corresponda al enlace (#jiraiya-iv…)
   ========================================================= */
(() => {
    "use strict";

    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- 1) Aparición ---------- */
    const revelar = $$(".reveal");
    if ("IntersectionObserver" in window && !reduce) {
        const io = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("in");
                    io.unobserve(e.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
        revelar.forEach((el) => io.observe(el));
    } else {
        revelar.forEach((el) => el.classList.add("in"));
    }

    /* ---------- 2) Chip activo ---------- */
    const chipsBox = $("#chips");
    const chips = $$("a[data-s]", chipsBox);
    const secciones = chips.map((c) => document.getElementById(c.dataset.s)).filter(Boolean);

    function marcar(id) {
        chips.forEach((c) => {
            const on = c.dataset.s === id;
            c.classList.toggle("on", on);
            if (on) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current");
            /* centra el chip sin mover la página */
            if (on && chipsBox.scrollWidth > chipsBox.clientWidth) {
                chipsBox.scrollTo({
                    left: c.offsetLeft - (chipsBox.clientWidth - c.offsetWidth) / 2,
                    behavior: reduce ? "auto" : "smooth"
                });
            }
        });
    }

    if ("IntersectionObserver" in window && secciones.length) {
        const visibles = new Map();
        const io2 = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => visibles.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
            let mejor = null, max = 0;
            visibles.forEach((v, id) => { if (v > max) { max = v; mejor = id; } });
            if (mejor) marcar(mejor);
        }, { rootMargin: "-120px 0px -45% 0px", threshold: [0, .1, .25, .5] });
        secciones.forEach((s) => io2.observe(s));
    }

    /* ---------- 3) Progreso personal ---------- */
    const KEY = "nydo-modo-sabio-progreso";
    const cajas = $$('.chk input[type="checkbox"]');
    let guardado = {};

    try { guardado = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { guardado = {}; }

    function guardar() {
        try { localStorage.setItem(KEY, JSON.stringify(guardado)); } catch (e) { /* modo privado */ }
    }

    function pintarProgreso() {
        const total = cajas.length;
        const hechos = cajas.filter((c) => c.checked).length;
        const pct = total ? Math.round((hechos / total) * 100) : 0;

        $("#doneCount").textContent = hechos;
        $("#totalCount").textContent = total;
        $("#ringTxt").textContent = pct + "%";
        $("#ring").style.setProperty("--p", pct);
        $("#barFill").style.transform = "scaleX(" + (pct / 100) + ")";

        ["j", "v", "f"].forEach((g) => {
            const grupo = cajas.filter((c) => c.dataset.g === g);
            const el = $('[data-count="' + g + '"]');
            if (el) el.textContent = grupo.filter((c) => c.checked).length + "/" + grupo.length;
        });
    }

    cajas.forEach((c) => {
        c.checked = !!guardado[c.dataset.k];
        c.addEventListener("change", () => {
            if (c.checked) guardado[c.dataset.k] = 1; else delete guardado[c.dataset.k];
            guardar();
            pintarProgreso();
        });
    });

    const reset = $("#resetProgress");
    if (reset) {
        reset.addEventListener("click", () => {
            if (!cajas.some((c) => c.checked)) return;
            if (!window.confirm("¿Reiniciar todo tu progreso?")) return;
            cajas.forEach((c) => { c.checked = false; });
            guardado = {};
            guardar();
            pintarProgreso();
        });
    }
    pintarProgreso();

    /* ---------- 4) Videos ----------
       En el HTML:
         <div class="vid" data-video="vid/mi-video.mp4"
              data-poster="img/portada.jpg" data-title="Título"></div>
       data-video acepta:
         · un MP4 de tu sitio  → vid/archivo.mp4
         · un enlace de YouTube → https://youtu.be/XXXXXXXXXXX
       Se carga al acercarte, se reproduce solo y SIN audio. */
    const FA = (clase) => { const i = document.createElement("i"); i.className = clase; return i; };

    function idYouTube(url) {
        const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/);
        return m ? m[1] : null;
    }

    function vacio(slot, texto) {
        const v = document.createElement("div");
        v.className = "vid-empty";
        v.append(FA("fa-solid fa-film"), document.createTextNode(texto || "El video estará disponible pronto."));
        slot.replaceChildren(v);
    }

    function cargar(slot, src, titulo) {
        const yt = idYouTube(src);

        if (yt) {
            const f = document.createElement("iframe");
            f.src = "https://www.youtube-nocookie.com/embed/" + yt +
                    "?autoplay=1&mute=1&loop=1&playlist=" + yt + "&rel=0&playsinline=1";
            f.title = titulo || "Video";
            f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
            f.allowFullscreen = true;
            slot.replaceChildren(f);
            return null;
        }

        const v = document.createElement("video");
        v.muted = true;              /* siempre sin audio */
        v.defaultMuted = true;
        v.setAttribute("muted", "");
        v.volume = 0;
        v.loop = true;
        v.autoplay = true;
        v.controls = true;
        v.playsInline = true;
        v.preload = "metadata";
        v.setAttribute("playsinline", "");
        v.setAttribute("webkit-playsinline", "");
        v.setAttribute("controlslist", "nodownload noremoteplayback");
        if (slot.dataset.poster) v.poster = slot.dataset.poster;

        /* Si alguien intenta activar el sonido, se vuelve a silenciar */
        v.addEventListener("volumechange", () => {
            if (!v.muted || v.volume > 0) { v.muted = true; v.volume = 0; }
        });

        const s = document.createElement("source");
        s.src = src;
        s.type = "video/mp4";
        s.addEventListener("error", () => vacio(slot));

        v.appendChild(s);
        slot.replaceChildren(v);
        v.play && v.play().catch(() => {});
        return v;
    }

    /* Los videos se cargan al acercarse a ellos, se reproducen solos y
       sin audio, y se pausan al salir de pantalla (ahorra datos y batería). */
    const slots = $$(".vid");

    slots.forEach((slot) => {
        if (!(slot.dataset.video || "").trim()) vacio(slot);
    });

    const pendientes = slots.filter((s) => (s.dataset.video || "").trim());

    function activar(slot) {
        const v = cargar(slot, slot.dataset.video.trim(), slot.dataset.title || "Video");
        if (!v || !("IntersectionObserver" in window)) return;

        new IntersectionObserver((ent) => {
            ent.forEach((e) => {
                if (!v.isConnected) return;
                if (e.isIntersecting) v.play().catch(() => {});
                else v.pause();
            });
        }, { threshold: 0.25 }).observe(slot);
    }

    if ("IntersectionObserver" in window) {
        const carga = new IntersectionObserver((ent) => {
            ent.forEach((e) => {
                if (!e.isIntersecting) return;
                carga.unobserve(e.target);
                activar(e.target);
            });
        }, { rootMargin: "250px 0px" });
        pendientes.forEach((s) => carga.observe(s));
    } else {
        pendientes.forEach(activar);
    }

    /* ---------- 5) Cronómetro de 6 s ---------- */
    const tBtn = $("#timerBtn"), tOut = $("#timerOut"), tFill = $("#timerFill");
    const tBox = tBtn ? tBtn.closest(".timer") : null;
    let tInt = null, tFin = 0;

    function detener() { clearInterval(tInt); tInt = null; }

    function reiniciarBarra() {
        tFill.classList.remove("run");
        tFill.style.transition = "none";
        void tFill.offsetWidth;
        tFill.style.transition = "";
    }

    if (tBtn) {
        tBtn.addEventListener("click", () => {
            detener();
            reiniciarBarra();
            tBox.classList.remove("done");

            tFin = performance.now() + 6000;
            requestAnimationFrame(() => tFill.classList.add("run"));

            tBtn.lastChild.textContent = "Reiniciar";
            tInt = setInterval(() => {
                const resto = Math.max(0, tFin - performance.now());
                tOut.textContent = (resto / 1000).toFixed(1) + " s";
                if (resto <= 0) {
                    detener();
                    tBox.classList.add("done");
                    tOut.textContent = "¡Tiempo!";
                    tBtn.lastChild.textContent = "Esquivé";
                }
            }, 100);
        });
    }

    /* ---------- 6) Enlaces profundos a acordeones ---------- */
    function abrirDesdeHash() {
        const id = decodeURIComponent(location.hash.slice(1));
        if (!id) return;
        const el = document.getElementById(id);
        if (!el) return;
        const det = el.matches("details") ? el : el.closest("details");
        if (det) det.open = true;
    }
    window.addEventListener("hashchange", abrirDesdeHash);
    abrirDesdeHash();
})();