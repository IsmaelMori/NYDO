/* =========================================
   BUSCADOR GLOBAL - NYDo WIKI
   Las páginas que se indexan se definen en
   la lista PAGINAS (justo debajo).
========================================= */

(() => {
    const input = document.getElementById("wikiSearchInput");
    const results = document.getElementById("wikiSearchResults");
    const clearButton = document.getElementById("wikiSearchClear");

    if (!input || !results || !clearButton) return;

    /* ---------------------------------------------------------
       PÁGINAS DEL BUSCADOR
       Para añadir una página nueva, agrega UNA línea aquí:
           { archivo: "nombre-del-archivo.html", nombre: "Nombre visible" },
       "nombre" es la etiqueta roja que aparece sobre cada resultado.
       Como todas las páginas cargan este mismo archivo, basta
       con editarlo una vez.
    --------------------------------------------------------- */
    const paginas = [
        { archivo: "jutsus.html",   nombre: "Jutsus" },
        { archivo: "dojutsus.html", nombre: "Dōjutsus" },
        { archivo: "clanes.html",   nombre: "Clanes" },
        { archivo: "guia.html",     nombre: "Guía del Mod" },
        { archivo: "stats.html",    nombre: "Stats" },
        // { archivo: "nueva-pagina.html", nombre: "Nueva página" },
    ];

    let indice = [];
    let indiceListo = false;
    let cargandoIndice = null;
    let solicitud = 0;
    let paginasFallidas = [];

    function normalizar(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s-]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function obtenerTexto(elemento) {
        return (elemento.innerText || elemento.textContent || "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function tituloElemento(elemento, pagina) {
        const encabezado = elemento.querySelector(
            "h1, h2, h3, h4, .section-head h2, .panel-heading h2"
        );

        if (encabezado && obtenerTexto(encabezado)) {
            return obtenerTexto(encabezado);
        }

        const aria = elemento.getAttribute("aria-label");
        if (aria) return aria;

        return pagina.nombre;
    }

    function descripcionElemento(elemento, titulo) {
        const parrafos = [...elemento.querySelectorAll("p")]
            .map(obtenerTexto)
            .filter(Boolean);

        let descripcion = parrafos.find(p => p !== titulo) || obtenerTexto(elemento);

        if (descripcion.length > 240) {
            descripcion = descripcion.slice(0, 237) + "...";
        }

        return descripcion;
    }

    function extraerEntradas(documento, pagina) {
        const entradas = [];
        const base = new URL(pagina.archivo, window.location.href);

        /*
          Secciones y tarjetas con identificadores permiten
          que los resultados abran un lugar concreto de la página.
        */
        const elementos = documento.querySelectorAll(
            "main section[id], main article[id], main [id].info-card, " +
            "main [id].step-card, main [id].point-card, main [id].tab-content"
        );

        elementos.forEach(elemento => {
            const id = elemento.id;
            if (!id) return;

            const texto = obtenerTexto(elemento);
            if (texto.length < 12) return;

            const titulo = tituloElemento(elemento, pagina);
            const descripcion = descripcionElemento(elemento, titulo);

            entradas.push({
                pagina: pagina.nombre,
                titulo,
                descripcion,
                texto: normalizar(titulo + " " + texto),
                url: base.href + "#" + encodeURIComponent(id)
            });
        });

        /*
          Si una página no tiene secciones con ID, se incluye
          una entrada general para que siga siendo localizable.
        */
        if (!entradas.length) {
            const main = documento.querySelector("main");
            if (main) {
                const texto = obtenerTexto(main);

                if (texto) {
                    entradas.push({
                        pagina: pagina.nombre,
                        titulo: pagina.nombre,
                        descripcion: texto.slice(0, 240),
                        texto: normalizar(texto),
                        url: base.href
                    });
                }
            }
        }

        return entradas;
    }

    async function construirIndice() {
        if (indiceListo) return indice;
        if (cargandoIndice) return cargandoIndice;

        cargandoIndice = (async () => {
            const entradas = [];
            paginasFallidas = [];

            for (const pagina of paginas) {
                const urlPagina = new URL(pagina.archivo, window.location.href);
                const esActual =
                    urlPagina.pathname === window.location.pathname;

                try {
                    let documento;

                    if (esActual) {
                        documento = document;
                    } else {
                        const respuesta = await fetch(urlPagina.href);

                        if (!respuesta.ok) {
                            throw new Error("No se pudo cargar " + pagina.archivo);
                        }

                        const html = await respuesta.text();
                        documento = new DOMParser().parseFromString(html, "text/html");
                    }

                    entradas.push(...extraerEntradas(documento, pagina));
                } catch (error) {
                    paginasFallidas.push(pagina.nombre);
                    console.warn(
                        "Buscador NYDo: no se pudo leer " + pagina.archivo,
                        error
                    );
                }
            }

            indice = entradas;
            indiceListo = true;
            return indice;
        })();

        try {
            return await cargandoIndice;
        } finally {
            cargandoIndice = null;
        }
    }

    function mostrarMensaje(mensaje) {
        results.innerHTML = "";

        const aviso = document.createElement("div");
        aviso.className = "wiki-search-empty";
        aviso.textContent = mensaje;

        results.appendChild(aviso);
        results.style.display = "block";
        input.setAttribute("aria-expanded", "true");
    }

    function pintarResultados(coincidencias) {
        results.innerHTML = "";

        if (!coincidencias.length) {
            mostrarMensaje(
                "No encontramos resultados. Prueba con otra palabra, como Sharingan, Uchiha, chakra o teclas."
            );
            return;
        }

        coincidencias.slice(0, 12).forEach(item => {
            const enlace = document.createElement("a");
            enlace.className = "wiki-search-result";
            enlace.href = item.url;

            const pagina = document.createElement("span");
            pagina.className = "wiki-search-result-page";
            pagina.textContent = item.pagina;

            const titulo = document.createElement("span");
            titulo.className = "wiki-search-result-title";
            titulo.textContent = item.titulo;

            const descripcion = document.createElement("span");
            descripcion.className = "wiki-search-result-description";
            descripcion.textContent = item.descripcion;

            enlace.append(pagina, titulo, descripcion);
            results.appendChild(enlace);
        });

        results.style.display = "block";
        input.setAttribute("aria-expanded", "true");
    }

    async function buscar() {
        const miSolicitud = ++solicitud;
        const consulta = normalizar(input.value);

        clearButton.style.display = consulta ? "block" : "none";

        if (consulta.length < 2) {
            results.style.display = "none";
            results.innerHTML = "";
            input.setAttribute("aria-expanded", "false");
            return;
        }

        mostrarMensaje("Buscando en la wiki...");

        const datos = await construirIndice();

        /* Evita que una búsqueda antigua reemplace una más reciente. */
        if (miSolicitud !== solicitud) return;

        if (!datos.length) {
            mostrarMensaje(
                "No se pudo cargar el índice. Abre la web mediante un servidor local o desde tu sitio publicado."
            );
            return;
        }

        const palabras = consulta.split(" ").filter(Boolean);

        const coincidencias = datos
            .map(item => {
                let puntuacion = 0;

                palabras.forEach(palabra => {
                    if (normalizar(item.titulo).includes(palabra)) {
                        puntuacion += 5;
                    }

                    if (item.texto.includes(palabra)) {
                        puntuacion += 2;
                    }

                    if (normalizar(item.pagina).includes(palabra)) {
                        puntuacion += 1;
                    }
                });

                const todasCoinciden = palabras.every(palabra =>
                    item.texto.includes(palabra) ||
                    normalizar(item.pagina).includes(palabra)
                );

                return {
                    ...item,
                    puntuacion,
                    todasCoinciden
                };
            })
            .filter(item => item.puntuacion > 0)
            .sort((a, b) =>
                Number(b.todasCoinciden) - Number(a.todasCoinciden) ||
                b.puntuacion - a.puntuacion
            );

        pintarResultados(coincidencias);

        /* Si alguna página no se pudo leer, se avisa en vez de
           dejar creer que simplemente no hay resultados. */
        if (paginasFallidas.length) {
            const aviso = document.createElement("div");
            aviso.className = "wiki-search-empty";
            aviso.textContent =
                "⚠ No se pudo leer: " + paginasFallidas.join(", ") +
                ". Abre la web desde un servidor local (por ejemplo Live Server) o desde tu sitio publicado.";
            results.appendChild(aviso);
        }
    }

    let temporizadorBusqueda;

    input.addEventListener("input", () => {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(buscar, 180);
    });

    input.addEventListener("focus", () => {
        if (input.value.trim().length >= 2) buscar();
    });

    clearButton.addEventListener("click", () => {
        input.value = "";
        results.innerHTML = "";
        results.style.display = "none";
        clearButton.style.display = "none";
        input.setAttribute("aria-expanded", "false");
        input.focus();
    });

    document.addEventListener("click", event => {
        if (!event.target.closest("#wikiSearch")) {
            results.style.display = "none";
            input.setAttribute("aria-expanded", "false");
        }
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            results.style.display = "none";
            input.setAttribute("aria-expanded", "false");
        }

        if (event.key === "Enter") {
            const primerResultado = results.querySelector(".wiki-search-result");

            if (primerResultado && results.style.display !== "none") {
                window.location.href = primerResultado.href;
            }
        }
    });
})();