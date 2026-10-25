/* ==========================================================
   NYDo Wiki · Animación de evolución ocular por sección
   Pega antes de </body>:  <script src="dojutsu-anim.js"></script>
   - Cada sección tiene sus ojos "dormidos".
   - Al entrar en la sección se activan UNA sola vez y evolucionan:
     normal → Sharingan → Mangekyō → Eterno → Rinnegan
   ========================================================== */
(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ALM = 'M8 55 Q100 -8 192 55 Q100 118 8 55 Z'; // forma de ojo (almendra)

    /* ---------- Estilos ---------- */
    var css = [
        '.jutsu-panel{position:relative}',
        '.dj-eyes{position:absolute;top:26px;right:34px;width:270px;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:2;pointer-events:none}',
        '.dj-row{position:relative;display:flex;gap:6px;width:100%}',
        '.dj-eye{flex:1;transition:filter 1s ease}',
        '.dj-eye.right{transform:scaleX(-1)}',
        '.dj-eyes.dormant .dj-eye{filter:grayscale(.6) brightness(.6) drop-shadow(0 0 2px rgba(255,255,255,.12)) !important}',
        '.dj-eye svg{display:block;width:100%;height:auto;overflow:visible}',
        '.dj-eye [data-s]{opacity:0;transition:opacity .7s ease}',
        '.dj-eye .sc{transition:fill .9s ease}',
        '.dj-eye .all{transform-box:fill-box;transform-origin:center}',
        '.dj-eye.blink .all{animation:djBlink .4s ease}',
        '@keyframes djBlink{0%,100%{transform:scaleY(1)}45%,55%{transform:scaleY(.05)}}',
        '.dj-label{font:700 11px/1 monospace;letter-spacing:1.5px;text-transform:uppercase;color:#cbd5e1;',
        'text-shadow:0 0 10px var(--c,#fff);transition:color .5s,opacity .5s;text-align:center}',
        '.dj-eyes.dormant .dj-label{opacity:.45}',
        '.dj-burst{position:absolute;left:50%;top:50%;width:20px;height:20px;border-radius:50%;',
        'border:2px solid var(--c,#fff);box-shadow:0 0 14px var(--c,#fff);',
        'transform:translate(-50%,-50%) scale(.2);opacity:0;pointer-events:none}',
        '.dj-eyes.burst .dj-burst{animation:djBurst 1s ease-out}',
        '@keyframes djBurst{0%{opacity:.95;transform:translate(-50%,-50%) scale(.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(12)}}',
        '@media (min-width:901px){.jutsu-panel.dj-has .panel-heading{padding-right:300px}}',
        '@media (max-width:900px){.dj-eyes{position:static;margin:0 auto 1.4rem;width:min(260px,100%)}}'
    ].join('\n');
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    /* ---------- Etapas ---------- */
    var STAGES = {
        normal:     { label: 'Ojo normal',            c: '#cbd5e1', sc: '#f4f1ee' },
        byakugan:   { label: 'Byakugan',              c: '#b9b4ff', sc: '#efecff' },
        sharingan1: { label: 'Sharingan · 1 tomoe',   c: '#ff3b4b', sc: '#f4f1ee' },
        sharingan3: { label: 'Sharingan · 3 tomoes',  c: '#ff3b4b', sc: '#f4f1ee' },
        ms:         { label: 'Mangekyō · Madara',     c: '#ff2030', sc: '#f4f1ee' },
        ems:        { label: 'Mangekyō Eterno · Madara', c: '#ff5a6a', sc: '#f4f1ee' },
        rinnegan:   { label: 'Rinnegan',              c: '#b15eff', sc: '#e6d2ff' }
    };

    /* secciones → secuencia de etapas (la primera es el estado dormido) */
    var CONFIG = [
        { id: 'byakugan',  seq: ['normal', 'byakugan'] },
        { id: 'sharingan', seq: ['normal', 'sharingan3'] },
        { id: 'mangekyo',  seq: ['sharingan3', 'ms'] },
        { id: 'eternal',   seq: ['ms', 'ems'] },
        { id: 'susanoo',   seq: ['ems'] },
        { id: 'rinnegan',  seq: ['ems', 'rinnegan'] }
    ];

    /* ---------- SVG helpers ---------- */
    var uid = 0;
    function el(name, attrs, parent) {
        var e = document.createElementNS(NS, name);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }
    function spin(parent, dur, reverse) {
        var g = el('g', {}, parent);
        el('animateTransform', {
            attributeName: 'transform', type: 'rotate',
            from: reverse ? '360' : '0', to: reverse ? '0' : '360',
            dur: dur + 's', repeatCount: 'indefinite'
        }, g);
        return g;
    }
    function tomoe(parent, angle, extra) {
        var a = el('g', { transform: 'rotate(' + angle + ')' }, parent);
        if (extra) a.setAttribute('data-s', extra);
        var t = el('g', { transform: 'translate(0 -22)' }, a);
        el('circle', { r: 5.5, fill: '#0c0304' }, t);
        el('path', { d: 'M-4.5 -3 C 0 -11, 9 -9, 11 -1 C 6 -6, 1 -5, 0 0 Z', fill: '#0c0304' }, t);
    }

    function buildEye(mirror) {
        uid++;
        var cid = 'djclip' + uid, gid = 'djgrad' + uid;
        var wrap = document.createElement('div');
        wrap.className = 'dj-eye' + (mirror ? ' right' : '');

        var svg = el('svg', { viewBox: '0 0 200 110', 'aria-hidden': 'true' });
        wrap.appendChild(svg);
        var defs = el('defs', {}, svg);
        el('path', { d: ALM }, el('clipPath', { id: cid }, defs));
        var rg = el('radialGradient', { id: gid }, defs);
        el('stop', { offset: '0%', 'stop-color': '#f6ecff' }, rg);
        el('stop', { offset: '100%', 'stop-color': '#c28bff' }, rg);

        var all = el('g', { class: 'all' }, svg);
        el('path', { d: ALM, class: 'sc', fill: '#f4f1ee', stroke: '#14141c', 'stroke-width': 3, 'stroke-linejoin': 'round' }, all);

        var clip = el('g', { 'clip-path': 'url(#' + cid + ')' }, all);
        function layer(stages, parent) {
            return el('g', { 'data-s': stages, transform: 'translate(100 55)' }, parent || clip);
        }

        /* normal */
        var n = layer('normal');
        el('circle', { r: 34, fill: '#5a3a24', stroke: '#2a180c', 'stroke-width': 2 }, n);
        el('circle', { r: 15, fill: '#120a06' }, n);
        el('circle', { cx: -6, cy: -7, r: 4, fill: '#fff', opacity: .8 }, n);

        /* byakugan */
        var b = layer('byakugan');
        el('circle', { r: 34, fill: '#ece8ff', stroke: '#a79ee6', 'stroke-width': 2 }, b);
        el('circle', { r: 26, fill: 'none', stroke: 'rgba(140,128,220,.35)', 'stroke-width': 1 }, b);
        var veins = el('g', { 'data-s': 'byakugan', fill: 'none', stroke: '#7b6fd1', 'stroke-width': 1.7, 'stroke-linecap': 'round' }, all);
        ['M30 22 L24 6', 'M52 12 L48 -2', 'M148 12 L152 -2', 'M170 22 L176 6', 'M30 88 L24 104',
         'M170 88 L176 104', 'M62 100 L60 112', 'M138 100 L140 112', 'M10 48 L-2 42', 'M190 48 L202 42']
            .forEach(function (d) { el('path', { d: d }, veins); });

        /* base roja (sharingan / ms / ems) */
        var r = layer('sharingan1 sharingan3 ms ems');
        el('circle', { r: 34, fill: '#d4141f', stroke: '#6e0810', 'stroke-width': 2 }, r);
        el('circle', { r: 22, fill: 'none', stroke: '#2a0508', 'stroke-width': 1.4, opacity: .9 }, r);
        el('circle', { r: 6, fill: '#0a0204' }, r);

        /* tomoes */
        var tm = layer('sharingan1 sharingan3');
        var sp = spin(tm, 9, false);
        tomoe(sp, 0);
        tomoe(sp, 120, 'sharingan3');
        tomoe(sp, 240, 'sharingan3');

        /* ---- Madara: dibujo basado en las referencias (unidades de radio 1) ---- */
        function P(rad, deg) {
            var t = deg * Math.PI / 180;
            return [rad * Math.cos(t), rad * Math.sin(t)];
        }
        function f(v) { return v.toFixed(3); }
        function blobPath() {
            var d = '';
            for (var i = 0; i <= 90; i++) {
                var deg = i * 4;
                var rr = 0.5 + 0.1 * Math.cos(3 * (deg - 102) * Math.PI / 180);
                var q = P(rr, deg);
                d += (i ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]) + ' ';
            }
            return d + 'Z';
        }
        function arcPath(c, half, ro, ri) {
            var a0 = c - half, a1 = c + half;
            var o0 = P(ro, a0), o1 = P(ro, a1), i1 = P(ri, a1), i0 = P(ri, a0);
            return 'M' + f(o0[0]) + ' ' + f(o0[1]) +
                ' A' + ro + ' ' + ro + ' 0 0 1 ' + f(o1[0]) + ' ' + f(o1[1]) +
                ' L' + f(i1[0]) + ' ' + f(i1[1]) +
                ' A' + ri + ' ' + ri + ' 0 0 0 ' + f(i0[0]) + ' ' + f(i0[1]) + ' Z';
        }
        var ANG = [-90, 30, 150];
        function core(g) {
            el('path', { d: blobPath(), fill: '#c4000a' }, g);
            ANG.forEach(function (a) {
                var q = P(0.64, a);
                el('circle', { cx: f(q[0]), cy: f(q[1]), r: 0.29, fill: '#050102' }, g);
            });
            ANG.forEach(function (a) {
                var q = P(0.64, a);
                el('circle', { cx: f(q[0]), cy: f(q[1]), r: 0.155, fill: '#d4141f' }, g);
            });
            el('circle', { r: 0.19, fill: '#050102' }, g);
        }

        /* Mangekyō Sharingan de Madara */
        var m = layer('ms');
        var sm = spin(el('g', { transform: 'scale(31)' }, m), 18, false);
        el('circle', { r: 0.68, fill: 'none', stroke: '#050102', 'stroke-width': 0.18 }, sm);
        el('circle', { r: 0.99, fill: 'none', stroke: '#050102', 'stroke-width': 0.1 }, sm);
        core(sm);

        /* Mangekyō Sharingan Eterno de Madara */
        var e = layer('ems');
        var se = spin(el('g', { transform: 'scale(31)' }, e), 18, true);
        el('circle', { r: 1.17, fill: '#050102' }, se);
        ANG.forEach(function (a) {
            el('path', { d: arcPath(a, 47, 0.97, 0.78), fill: '#b80008' }, se);
        });
        core(se);

        /* rinnegan */
        var rn = layer('rinnegan');
        el('circle', { r: 80, fill: 'url(#' + gid + ')' }, rn);
        [7, 14, 21, 28, 35, 42, 50, 58, 66].forEach(function (rr) {
            el('circle', { r: rr, fill: 'none', stroke: '#3d1c66', 'stroke-width': 1.4 }, rn);
        });
        el('circle', { r: 3.5, fill: '#1a0a2e' }, rn);

        return wrap;
    }

    /* ---------- Control de etapas ---------- */
    function applyStage(box, stage) {
        var info = STAGES[stage];
        box.querySelectorAll('.dj-eye').forEach(function (eye) {
            eye.querySelectorAll('[data-s]').forEach(function (g) {
                g.style.opacity = g.getAttribute('data-s').split(' ').indexOf(stage) > -1 ? '1' : '0';
            });
            eye.querySelector('.sc').style.fill = info.sc;
            eye.style.filter = 'drop-shadow(0 0 12px ' + info.c + ')';
        });
        var lab = box.querySelector('.dj-label');
        lab.textContent = info.label;
        box.style.setProperty('--c', info.c);
    }

    function burst(box) {
        box.classList.remove('burst');
        void box.offsetWidth;
        box.classList.add('burst');
    }

    function blink(box) {
        box.querySelectorAll('.dj-eye').forEach(function (eye) {
            eye.classList.remove('blink');
            void eye.offsetWidth;
            eye.classList.add('blink');
        });
    }

    function play(box, seq) {
        box.classList.remove('dormant');
        applyStage(box, seq[0]);
        burst(box);
        var i = 0;
        function next() {
            i++;
            if (i >= seq.length) return;
            blink(box);
            setTimeout(function () {
                applyStage(box, seq[i]);
                burst(box);
            }, 190);
            setTimeout(next, 1900);
        }
        setTimeout(next, 1300);
    }

    /* ---------- Montaje ---------- */
    function init() {
        var items = [];

        CONFIG.forEach(function (cfg) {
            var panel = document.getElementById(cfg.id);
            if (!panel) return;

            var box = document.createElement('div');
            box.className = 'dj-eyes dormant';
            var row = document.createElement('div');
            row.className = 'dj-row';
            row.appendChild(buildEye(false));
            row.appendChild(buildEye(true));
            var burstEl = document.createElement('span');
            burstEl.className = 'dj-burst';
            row.appendChild(burstEl);
            var label = document.createElement('div');
            label.className = 'dj-label';
            box.appendChild(row);
            box.appendChild(label);

            panel.classList.add('dj-has');
            panel.insertBefore(box, panel.firstChild);

            applyStage(box, cfg.seq[0]);

            if (reduce) {
                box.classList.remove('dormant');
                applyStage(box, cfg.seq[cfg.seq.length - 1]);
            } else {
                items.push({ panel: panel, box: box, seq: cfg.seq });
            }
        });

        if (!items.length) return;

        if (!('IntersectionObserver' in window)) {
            items.forEach(function (it) { play(it.box, it.seq); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var it = items.filter(function (x) { return x.panel === en.target; })[0];
                io.unobserve(en.target);            // solo una vez
                if (it) play(it.box, it.seq);
            });
        }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });

        items.forEach(function (it) { io.observe(it.panel); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
