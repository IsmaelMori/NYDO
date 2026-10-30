/* =========================================================
   translate.js  -  Selector de idioma para NYDo Wiki
   Idiomas: Español (original), English, Português, Français
   Usa el traductor de Google en segundo plano, pero con un
   selector propio que combina con el diseño de la wiki.

   Para añadir otro idioma, agrega una línea en LANGS
   (por ejemplo: { code: 'de', short: 'DE', name: 'Deutsch' }).
   ========================================================= */
(function () {
    'use strict';

    var PAGE_LANG = 'es'; // idioma en el que está escrita la wiki

    var LANGS = [
        { code: 'es', short: 'ES', name: 'Español' },
        { code: 'en', short: 'EN', name: 'English' },
        { code: 'pt', short: 'PT', name: 'Português' },
        { code: 'fr', short: 'FR', name: 'Français' }
    ];

    /* ---------- Idioma actual (se guarda en la cookie de Google) ---------- */
    function getCurrent() {
        var m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^\/]*\/([^;]+)/);
        var code = m ? decodeURIComponent(m[1]) : PAGE_LANG;
        for (var i = 0; i < LANGS.length; i++) {
            if (LANGS[i].code === code) return code;
        }
        return PAGE_LANG;
    }

    function setCookie(value, days) {
        var exp = days
            ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString()
            : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'googtrans=' + value + exp + '; path=/';
        document.cookie = 'googtrans=' + value + exp + '; path=/; domain=' + location.hostname;
    }

    function changeLang(code) {
        if (code === getCurrent()) return;
        if (code === PAGE_LANG) {
            setCookie('', 0);               // volver al español: borrar cookie
        } else {
            setCookie('/' + PAGE_LANG + '/' + code, 365);
        }
        location.reload();
    }

    /* ---------- Cosas que NO deben traducirse (marca, símbolos) ---------- */
    function markNoTranslate() {
        var sel = '.brand-name, .brand-symbol, .hero-symbol, .footer-symbol, .button-symbol, .hero-logo h1';
        var els = document.querySelectorAll(sel);
        for (var i = 0; i < els.length; i++) {
            els[i].setAttribute('translate', 'no');
            els[i].classList.add('notranslate');
        }
    }

    /* ---------- Traductor de Google (oculto) ---------- */
    function loadGoogle() {
        var holder = document.createElement('div');
        holder.id = 'google_translate_element';
        holder.className = 'notranslate';
        holder.style.display = 'none';
        document.body.appendChild(holder);

        var included = LANGS
            .filter(function (l) { return l.code !== PAGE_LANG; })
            .map(function (l) { return l.code; })
            .join(',');

        window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement({
                pageLanguage: PAGE_LANG,
                includedLanguages: included,
                autoDisplay: false
            }, 'google_translate_element');
        };

        var s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        s.async = true;
        document.head.appendChild(s);
    }

    /* ---------- Estilos del selector y ocultar la barra de Google ---------- */
    function injectStyles() {
        var css = [
            '.nydo-lang{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif}',
            '.nydo-lang-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,138,31,.55);background:rgba(10,14,24,.92);color:#fff;font-size:13px;font-weight:800;letter-spacing:1px;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.45);transition:transform .2s ease,border-color .2s ease}',
            '.nydo-lang-btn:hover,.nydo-lang-btn:focus-visible{transform:translateY(-2px);border-color:#ff8a1f;outline:none}',
            '.nydo-lang-btn i{color:#ff8a1f;font-size:15px}',
            '.nydo-lang-menu{position:absolute;right:0;bottom:calc(100% + 10px);min-width:170px;margin:0;padding:6px;list-style:none;border-radius:14px;border:1px solid rgba(255,138,31,.35);background:rgba(10,14,24,.97);box-shadow:0 14px 34px rgba(0,0,0,.55)}',
            '.nydo-lang-menu[hidden]{display:none}',
            '.nydo-lang-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-radius:10px;background:transparent;color:#f4f5fa;font-size:14px;text-align:left;cursor:pointer}',
            '.nydo-lang-menu button:hover,.nydo-lang-menu button:focus-visible{background:rgba(255,138,31,.16);outline:none}',
            '.nydo-lang-menu button.active{background:linear-gradient(135deg,rgba(229,9,32,.35),rgba(255,138,31,.35));font-weight:700}',
            '.nydo-lang-menu .code{display:inline-grid;place-items:center;min-width:30px;padding:2px 6px;border-radius:6px;background:rgba(255,255,255,.1);color:#ff8a1f;font-size:11px;font-weight:800;letter-spacing:1px}',
            /* Ocultar la barra y los avisos de Google Translate */
            'body{top:0!important}',
            'body>.skiptranslate,iframe.goog-te-banner-frame,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf{display:none!important}',
            '.goog-tooltip,.goog-tooltip:hover{display:none!important}',
            '.goog-text-highlight{background:none!important;box-shadow:none!important}',
            '#goog-gt-tt,.goog-te-balloon-frame{display:none!important}'
        ].join('\n');

        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ---------- Selector visual ---------- */
    function buildUI(current) {
        var cur = LANGS.filter(function (l) { return l.code === current; })[0] || LANGS[0];

        var wrap = document.createElement('div');
        wrap.className = 'nydo-lang notranslate';
        wrap.setAttribute('translate', 'no');

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nydo-lang-btn';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Idioma / Language / Langue / Idioma');
        btn.innerHTML = '<i class="fa-solid fa-globe" aria-hidden="true"></i><span>' + cur.short + '</span>';

        var menu = document.createElement('ul');
        menu.className = 'nydo-lang-menu';
        menu.hidden = true;

        LANGS.forEach(function (l) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('data-lang', l.code);
            if (l.code === current) b.className = 'active';
            b.innerHTML = '<span class="code">' + l.short + '</span><span>' + l.name + '</span>';
            li.appendChild(b);
            menu.appendChild(li);
        });

        function close() {
            menu.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = menu.hidden;
            menu.hidden = !open;
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        menu.addEventListener('click', function (e) {
            var b = e.target.closest('button[data-lang]');
            if (b) changeLang(b.getAttribute('data-lang'));
        });

        document.addEventListener('click', close);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
        });

        wrap.appendChild(btn);
        wrap.appendChild(menu);
        document.body.appendChild(wrap);
    }

    /* ---------- Inicio ---------- */
    function init() {
        var current = getCurrent();
        injectStyles();
        markNoTranslate();
        buildUI(current);
        if (current !== PAGE_LANG) loadGoogle(); // en español no se carga nada extra
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
