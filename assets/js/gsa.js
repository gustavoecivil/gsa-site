/* GSA — Inteligência para Decisão · interações do site (sem dependências) */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  const data = (id) => { try { return JSON.parse($(`#${id}`).textContent); } catch { return null; } };
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && el.append(c));
    return el;
  };

  /* ---------------- Header ---------------- */
  const header = $('#siteHeader');
  const film = $('#film');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const threshold = film ? Math.max(80, film.offsetHeight - 120) : 40;
    header.classList.toggle('is-solid', y > threshold || header.dataset.transparent === 'false');
    header.classList.toggle('is-hidden', y > 500 && y > lastY && !header.classList.contains('is-open'));
    lastY = y;
    const cta = $('#mobileCta');
    if (cta) {
      const footer = $('.site-footer');
      const nearEnd = footer && footer.getBoundingClientRect().top < innerHeight;
      cta.classList.toggle('on', y > innerHeight * 0.9 && !nearEnd);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menus suspensos (clique + teclado; hover em desktop)
  $$('.has-menu').forEach((li) => {
    const b = $('button', li);
    const set = (open) => { li.dataset.open = open; b.setAttribute('aria-expanded', open); };
    b.addEventListener('click', () => { const o = li.dataset.open !== 'true'; $$('.has-menu').forEach((x) => x !== li && (x.dataset.open = 'false', $('button', x).setAttribute('aria-expanded', 'false'))); set(o); });
    if (matchMedia('(hover: hover)').matches) { li.addEventListener('mouseenter', () => set(true)); li.addEventListener('mouseleave', () => set(false)); }
    li.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); b.focus(); } });
    li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) set(false); });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.has-menu')) $$('.has-menu').forEach((x) => { x.dataset.open = 'false'; $('button', x).setAttribute('aria-expanded', 'false'); }); });

  const toggle = $('#menuToggle');
  if (toggle) {
    const setOpen = (o) => { header.classList.toggle('is-open', o); toggle.setAttribute('aria-expanded', o); toggle.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu'); document.body.style.overflow = o ? 'hidden' : ''; };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    $('#mobilePanel').addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
  }

  /* ---------------- Revelação e paralaxe ---------------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, [data-in]').forEach((el) => (reduced ? el.classList.add('in') : io.observe(el)));

  const para = $$('[data-parallax]');
  if (para.length && !reduced) {
    const tick = () => para.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.transform = `translate3d(0, ${p * -6}%, 0)`;
    });
    addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
    tick();
  }

  /* ---------------- Filme institucional ---------------- */
  if (film) {
    const v = $('#filmVideo');
    const bSound = $('[data-film="sound"]', film), bPlay = $('[data-film="play"]', film), bReplay = $('[data-film="replay"]', film);
    const prog = $('[data-film="progress"]', film), bar = $('span', prog), time = $('[data-film="time"]', film);
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const icons = {
      on: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 6h2.5L8 3v10L4.5 10H2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.6a6 6 0 0 1 0 8.8" stroke="currentColor" stroke-width="1.3"/></svg>',
      off: bSound.querySelector('svg').outerHTML,
      play: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 3v10l8-5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
      pause: bPlay.querySelector('svg').outerHTML,
    };
    const paintSound = () => { bSound.innerHTML = `${v.muted ? icons.off : icons.on}<span>${v.muted ? 'Ativar som' : 'Silenciar'}</span>`; bSound.setAttribute('aria-pressed', String(!v.muted)); };
    const paintPlay = () => { bPlay.innerHTML = `${v.paused ? icons.play : icons.pause}<span class="lbl-long">${v.paused ? 'Assistir' : 'Pausar'}</span>`; bPlay.setAttribute('aria-label', v.paused ? 'Reproduzir filme' : 'Pausar filme'); };
    bSound.addEventListener('click', () => { v.muted = !v.muted; if (!v.muted && v.paused) v.play().catch(() => {}); paintSound(); });
    bPlay.addEventListener('click', () => { v.paused ? v.play().catch(() => {}) : v.pause(); });
    bReplay.addEventListener('click', () => { v.currentTime = 0; v.play().catch(() => {}); });
    const seek = (clientX) => { const r = prog.getBoundingClientRect(); if (v.duration) v.currentTime = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * v.duration; };
    prog.addEventListener('click', (e) => seek(e.clientX));
    prog.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 5); if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 5); });
    v.addEventListener('timeupdate', () => {
      if (!v.duration) return;
      bar.style.width = `${(v.currentTime / v.duration) * 100}%`;
      time.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`;
      prog.setAttribute('aria-valuenow', Math.round(v.currentTime));
      // Na pergunta final e na vinheta, a legenda sai de cena para o filme falar sozinho.
      film.classList.toggle('is-finale', v.currentTime > v.duration - 11);
    });
    v.addEventListener('ended', () => { film.classList.remove('is-finale'); paintPlay(); });
    ['play', 'pause'].forEach((ev) => v.addEventListener(ev, paintPlay));
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); }
    else v.play().catch(() => paintPlay());
    // Pausa quando sai da tela (economia de bateria); retoma se estava tocando.
    let wasPlaying = false;
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) { wasPlaying = !v.paused; v.pause(); } else if (wasPlaying) v.play().catch(() => {}); }, { threshold: 0.25 }).observe(film);
    paintSound(); paintPlay();
  }

  /* ---------------- Prévia de imagem no índice de soluções ---------------- */
  const list = $('[data-index-preview]');
  if (list && matchMedia('(hover: hover) and (min-width: 761px)').matches) {
    const box = h('div', { class: 'index-preview', 'aria-hidden': 'true' }, h('img', { alt: '' }));
    document.body.append(box);
    const img = $('img', box);
    $$('.index-row', list).forEach((row) => {
      row.addEventListener('mouseenter', () => { img.src = row.dataset.img; box.classList.add('on'); });
      row.addEventListener('mouseleave', () => box.classList.remove('on'));
      row.addEventListener('mousemove', (e) => { box.style.left = `${e.clientX + 170}px`; box.style.top = `${e.clientY}px`; });
    });
  }

  /* ---------------- Visual: dados dispersos → barras da marca ---------------- */
  $$('[data-xp="order"]').forEach((root) => {
    const g = $('.dots', root);
    const NS = 'http://www.w3.org/2000/svg';
    // Barras da logomarca (proporções 54/85/121/155) escaladas para a área do gráfico
    const bars = [54, 85, 121, 155].map((hgt, i) => ({ x: 100 + i * 60, h: hgt * 1.75 }));
    const pts = [];
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    bars.forEach((b) => { for (let y = 0; y < b.h; y += 14) pts.push({ bx: b.x, by: 340 - y }); });
    pts.push({ bx: 280, by: 340 - bars[3].h - 34, gold: true });
    pts.forEach((p) => {
      p.sx = 30 + rnd() * 340; p.sy = 30 + rnd() * 320; p.x = p.sx; p.y = p.sy; p.delay = rnd() * 450;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', p.gold ? 9 : 5); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      c.classList.add('dot'); if (p.gold) c.classList.add('gold');
      g.append(c); p.el = c;
    });
    const btns = $$('[data-state]', root);
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    let anim = 0;
    const set = (ordered) => {
      root.classList.toggle('is-ordered', ordered);
      btns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.state === 'b') === ordered)));
      const id = ++anim, t0 = performance.now(), dur = reduced ? 0 : 1400;
      pts.forEach((p) => { p.fx = p.x; p.fy = p.y; p.tx = ordered ? p.bx : p.sx; p.ty = ordered ? p.by : p.sy; });
      const step = (now) => {
        if (id !== anim) return;
        let busy = false;
        pts.forEach((p) => {
          const t = dur ? Math.min(1, Math.max(0, (now - t0 - p.delay) / dur)) : 1;
          if (t < 1) busy = true;
          const e = ease(t); p.x = p.fx + (p.tx - p.fx) * e; p.y = p.fy + (p.ty - p.fy) * e;
          p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1));
        });
        if (busy) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      // Garantia: se a aba não estiver desenhando quadros, chega ao estado final mesmo assim.
      setTimeout(() => { if (id === anim) step(t0 + dur + 1000); }, dur + 900);
    };
    set(false);
    btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.state === 'b')));
    new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { setTimeout(() => set(true), reduced ? 0 : 600); obs.disconnect(); } }, { threshold: 0.4 }).observe(root);
  });

  /* ---------------- Gráficos SVG simples (experiência 1) ---------------- */
  function chart(spec) {
    const W = 460, H = 220, P = { l: 36, r: 12, t: 14, b: 28 };
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    const all = spec.series.flatMap((s) => s.values).concat(spec.target ? [spec.target.value] : []);
    const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); return e; };
    const txt = (x, y, t, a = {}) => { const e = el('text', { x, y, fill: '#8f8f8a', 'font-size': 10, 'font-family': 'JetBrains Mono, monospace', ...a }); e.textContent = t; return e; };
    svg.setAttribute('aria-label', `${spec.series.map((s) => s.name).join(', ')}: ${spec.labels.map((l, i) => `${l} ${spec.series[0].values[i]}`).join('; ')}`);
    if (spec.type === 'hbars') {
      const min = Math.min(0, ...all), max = Math.max(...all);
      const x = (v) => P.l + 70 + ((v - min) / (max - min)) * (W - P.l - 70 - P.r - 30);
      const rowH = (H - P.t - P.b) / spec.labels.length;
      el('line', { x1: x(0), x2: x(0), y1: P.t, y2: H - P.b, stroke: '#3a3d42' });
      spec.labels.forEach((l, i) => {
        const v = spec.series[0].values[i], y = P.t + i * rowH + 4;
        txt(4, y + rowH / 2, l, { 'dominant-baseline': 'middle' });
        const r = el('rect', { x: x(Math.min(0, v)), y, height: rowH - 10, width: Math.abs(x(v) - x(0)), rx: 2, fill: spec.target && v > spec.target.value ? '#d08a6a' : spec.series[0].color, class: 'bar-h' });
        r.style.animationDelay = `${i * 60}ms`;
        txt(x(Math.max(0, v)) + 6, y + (rowH - 10) / 2, `${v > 0 ? '+' : ''}${v}${spec.series[0].name.includes('%') ? '%' : ''}`, { 'dominant-baseline': 'middle', fill: '#f3eee5' });
      });
      if (spec.target) { const tx = x(spec.target.value); el('line', { x1: tx, x2: tx, y1: P.t, y2: H - P.b, stroke: '#b88b4f', 'stroke-dasharray': '3 3' }); txt(tx + 4, H - 8, spec.target.label, { fill: '#d4b07c' }); }
      return svg;
    }
    const max = Math.max(...all) * 1.08, min = spec.type === 'line' ? Math.min(...all) * 0.96 : 0;
    const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    for (let i = 0; i <= 3; i++) { const v = min + ((max - min) * i) / 3; el('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), stroke: '#24272b' }); txt(2, y(v) + 3, v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(v < 10 ? 1 : 0)); }
    const n = spec.labels.length, band = (W - P.l - P.r) / n;
    spec.labels.forEach((l, i) => txt(P.l + band * i + band / 2, H - 8, l, { 'text-anchor': 'middle' }));
    if (spec.type === 'bars') {
      const k = spec.series.length, bw = Math.min(28, (band * 0.7) / k);
      spec.series.forEach((s, si) => s.values.forEach((v, i) => {
        const bx = P.l + band * i + band / 2 - (bw * k) / 2 + si * bw;
        const r = el('rect', { x: bx + 1, width: bw - 2, y: y(v), height: y(min) - y(v), rx: 2, fill: s.color, class: 'bar-v' });
        r.style.animationDelay = `${(i * k + si) * 60}ms`;
      }));
    } else {
      spec.series.forEach((s) => {
        const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${P.l + band * i + band / 2},${y(v)}`).join(' ');
        el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, class: 'line-draw' });
        s.values.forEach((v, i) => el('circle', { cx: P.l + band * i + band / 2, cy: y(v), r: 3, fill: s.color }));
      });
    }
    if (spec.target) { const ty = y(spec.target.value); el('line', { x1: P.l, x2: W - P.r, y1: ty, y2: ty, stroke: '#b88b4f', 'stroke-dasharray': '4 4' }); txt(W - P.r - 4, ty - 5, spec.target.label, { 'text-anchor': 'end', fill: '#d4b07c' }); }
    return svg;
  }

  /* ---------------- Experiência 1 — Converse com seu negócio ---------------- */
  $$('[data-xp="ask"]').forEach((root) => {
    const items = data(root.dataset.source); if (!items) return;
    const chips = $('.ask-chips', root), typed = $('.typed', root), steps = $('.ask-steps', root), ans = $('.ask-answer', root);
    let run = 0;
    const play = async (i) => {
      const id = ++run, it = items[i];
      $$('.chip', chips).forEach((c, j) => c.setAttribute('aria-pressed', String(i === j)));
      ans.classList.remove('on'); steps.replaceChildren();
      typed.textContent = '';
      const caret = h('span', { class: 'caret' });
      for (let c = 0; c <= it.q.length; c += reduced ? it.q.length : 2) {
        if (id !== run) return;
        typed.textContent = it.q.slice(0, c); typed.append(caret);
        await wait(14);
      }
      typed.textContent = it.q;
      for (const s of it.steps) {
        if (id !== run) return;
        const li = h('li', {}, h('span', { class: 'tick' }), s);
        steps.append(li);
        await wait(30); li.classList.add('on'); await wait(380); li.classList.add('done');
      }
      if (id !== run) return;
      const legend = it.chart.type === 'hbars' ? null : h('div', { class: 'legend' }, it.chart.series.map((s) => h('span', {}, h('i', { style: `background:${s.color}` }), s.name)));
      ans.replaceChildren(
        h('div', {}, h('span', { class: 'mono gold' }, 'Análise simulada'), h('h4', {}, it.title), h('p', {}, it.text),
          h('div', { class: 'metrics-used', 'aria-label': 'Métricas homologadas utilizadas' }, it.metrics.map((m) => h('span', {}, m))),
          h('p', { class: 'next-q' }, h('b', {}, 'Próxima pergunta sugerida: '), it.next)),
        h('div', {}, h('div', { class: 'kpis' }, it.kpis.map(([l, v, d, dir]) => h('div', { class: 'kpi' }, h('span', { class: 'mono' }, l), h('b', {}, v), d ? h('small', { class: dir }, d) : ''))),
          h('div', { class: 'chart-box' }, chart(it.chart), legend)));
      requestAnimationFrame(() => ans.classList.add('on'));
    };
    items.forEach((it, i) => chips.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: () => play(i) }, it.chip)));
    let started = false;
    new IntersectionObserver(([e], o) => { if (e.isIntersecting && !started) { started = true; play(0); o.disconnect(); } }, { threshold: 0.35 }).observe(root);
  });

  /* ---------------- Experiência 2 — Agente passivo × ativo ---------------- */
  $$('[data-xp="agents"]').forEach((root) => {
    const sc = data(root.dataset.source); if (!sc) return;
    const tabs = $('.agent-scen', root);
    const fp = $('[data-feed="passive"]', root), fa = $('[data-feed="active"]', root);
    const ftp = $('[data-foot="passive"]', root), fta = $('[data-foot="active"]', root);
    let cur = Math.max(0, sc.findIndex((s) => s.id === root.dataset.start)), run = 0;
    const play = async () => {
      const id = ++run, s = sc[cur];
      $$('.seg-btn', tabs).forEach((b, j) => b.setAttribute('aria-selected', String(j === cur)));
      fp.replaceChildren(); fa.replaceChildren(); ftp.innerHTML = ''; fta.innerHTML = '';
      const mk = s.passive.msgs.map(([who, t]) => h('div', { class: `msg ${who}` }, h('span', { class: 'who' }, who === 'client' ? 'Cliente' : 'Agente GSA'), t));
      const ev = s.active.evs.map(([ic, b, t, cls]) => h('div', { class: `ev${cls ? ` is-${cls}` : ''}` }, h('span', { class: 'ico' }, ic), h('div', {}, h('b', {}, b), h('span', {}, t))));
      mk.forEach((m) => fp.append(m)); ev.forEach((e) => fa.append(e));
      const n = Math.max(mk.length, ev.length);
      for (let i = 0; i < n; i++) {
        if (id !== run) return;
        mk[i]?.classList.add('on'); ev[i]?.classList.add('on');
        await wait(900);
      }
      if (id !== run) return;
      ftp.innerHTML = s.passive.foot; fta.innerHTML = s.active.foot;
    };
    sc.forEach((s, i) => tabs.append(h('button', { class: 'seg-btn', type: 'button', role: 'tab', 'aria-selected': 'false', onclick: () => { cur = i; play(); } }, s.name)));
    $('[data-replay]', root).addEventListener('click', play);
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { play(); o.disconnect(); } }, { threshold: 0.3 }).observe(root);
  });

  /* ---------------- Experiência 3 — BI tradicional × Analytics autônomo ---------------- */
  $$('[data-xp="race"]').forEach((root) => {
    const btn = $('[data-run]', root);
    const slow = $$('.lane.slow li', root), fast = $$('.lane.fast li', root);
    const cs = $('[data-clock="slow"]', root), cf = $('[data-clock="fast"]', root);
    const rs = $('[data-result="slow"]', root), rf = $('[data-result="fast"]', root);
    let run = 0;
    btn.addEventListener('click', async () => {
      const id = ++run;
      [...slow, ...fast].forEach((li) => li.classList.remove('on'));
      cs.textContent = '—'; cf.textContent = '—'; rs.textContent = ''; rf.textContent = '';
      btn.disabled = true;
      const fastLabels = ['3 s', '5 s', '8 s', '14 s', '22 s', '~1 min'];
      for (let i = 0; i < fast.length; i++) { if (id !== run) return; fast[i].classList.add('on'); cf.textContent = fastLabels[i]; await wait(260); }
      rf.textContent = 'Dashboard no padrão da empresa, com as métricas usadas e a explicação. O gestor já pode fazer a próxima pergunta.';
      const days = [1, 4, 6, 8, 11, 12];
      for (let i = 0; i < slow.length; i++) { if (id !== run) return; slow[i].classList.add('on'); cs.textContent = `${days[i]} ${days[i] > 1 ? 'dias' : 'dia'}`; await wait(650); }
      rs.textContent = 'Relatório entregue. Mas a pergunta seguinte volta para a fila.';
      btn.disabled = false;
      btn.innerHTML = btn.innerHTML.replace('Fazer a pergunta', 'Repetir comparação');
    });
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { setTimeout(() => btn.click(), reduced ? 0 : 500); o.disconnect(); } }, { threshold: 0.4 }).observe(root);
  });

  /* ---------------- Experiência 4 — Jornada do cliente no CRM ---------------- */
  $$('[data-xp="journey"]').forEach((root) => {
    const st = data(root.dataset.source); if (!st) return;
    const bar = $('.journey', root), prog = $('.journey-progress', root), panel = $('.stage-panel', root);
    let cur = 0, timer = null;
    const funnelW = [100, 78, 52, 34, 24, 18];
    const show = (i) => {
      cur = i; const s = st[i];
      $$('.stage', bar).forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.classList.toggle('past', j < i); b.tabIndex = j === i ? 0 : -1; });
      prog.style.width = `${(i / (st.length - 1)) * 84}%`;
      panel.replaceChildren(
        h('div', {}, h('span', { class: 'mono' }, `Etapa ${s.n} · ${s.name}`), h('h4', {}, s.title), h('p', {}, s.text),
          h('div', { class: 'funnel', 'aria-hidden': 'true' }, funnelW.map((w, j) => h('div', { class: j === i ? 'on' : '', style: `width:${w}%` }, h('span', {}, st[j].name))))),
        h('div', {}, h('span', { class: 'mono' }, 'Dados registrados'), h('ul', {}, s.data.map((d) => h('li', {}, d)))),
        h('div', {}, h('span', { class: 'mono' }, 'Inteligência em ação'), h('p', {}, s.agent), h('div', { class: 'signal' }, h('b', {}, 'Indicadores: '), s.kpi)));
    };
    st.forEach((s, i) => bar.append(h('button', { class: 'stage', type: 'button', role: 'tab', 'aria-selected': 'false', onclick: () => { clearInterval(timer); show(i); } }, h('span', { class: 'node' }, s.n), s.name)));
    bar.addEventListener('keydown', (e) => { if (['ArrowRight', 'ArrowLeft'].includes(e.key)) { clearInterval(timer); const n = (cur + (e.key === 'ArrowRight' ? 1 : -1) + st.length) % st.length; show(n); $$('.stage', bar)[n].focus(); } });
    $('[data-auto]', root).addEventListener('click', () => { clearInterval(timer); show(0); timer = setInterval(() => { if (cur >= st.length - 1) return clearInterval(timer); show(cur + 1); }, reduced ? 50 : 2200); });
    show(0);
  });

  /* ---------------- Experiência 5 — Inteligência por segmento ---------------- */
  $$('[data-xp="sectors"]').forEach((root) => {
    const sec = data(root.dataset.source); if (!sec) return;
    const tabs = $('.sector-tabs', root), img = $('.sector-photo img', root), det = $('.sector-detail', root);
    const show = (i) => {
      const s = sec[i];
      $$('.sector-tab', tabs).forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      img.classList.add('fade');
      setTimeout(() => { img.src = s.img; img.style.objectPosition = s.pos; img.alt = s.name; img.onload = () => img.classList.remove('fade'); if (img.complete) img.classList.remove('fade'); }, reduced ? 0 : 250);
      $('[data-s="kicker"]', root).textContent = s.kicker; $('[data-s="name"]', root).textContent = s.name; $('[data-s="pitch"]', root).textContent = s.pitch;
      const col = (t, arr) => h('div', {}, h('h4', {}, t), h('ul', {}, arr.map((x) => h('li', {}, x))));
      det.classList.remove('swap'); void det.offsetWidth; det.classList.add('swap');
      det.replaceChildren(col('Problemas comuns', s.problems), col('Soluções GSA', s.solutions),
        h('div', {}, h('h4', {}, 'Indicadores'), h('div', { class: 'kpi-tags' }, s.indicators.map((k) => h('span', {}, k)))),
        col('Oportunidades', s.opportunities),
        h('div', { class: 'full' }, h('p', {}, `Quer ver como isso se aplica ao seu negócio de ${s.name.toLowerCase()}?`),
          h('div', { class: 'actions' }, h('a', { class: 'btn', href: `${s.slug}.html` }, 'Ver o segmento'), h('a', { class: 'btn btn-ghost', href: `contato.html?segmento=${s.id}` }, 'Conversar'))));
    };
    sec.forEach((s, i) => tabs.append(h('button', { class: 'sector-tab', type: 'button', role: 'tab', 'aria-selected': 'false', onclick: () => show(i) }, s.name)));
    tabs.addEventListener('keydown', (e) => { if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return; const all = $$('.sector-tab', tabs); const c = all.findIndex((b) => b.getAttribute('aria-selected') === 'true'); const n = (c + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length; show(n); all[n].focus(); });
    show(Math.max(0, sec.findIndex((s) => s.id === root.dataset.start)));
  });

  /* ---------------- Diagnóstico rápido de maturidade ---------------- */
  $$('[data-xp="quiz"]').forEach((root) => {
    const Q = [
      ['Quando a diretoria pede um número importante, o que acontece?', ['Alguém monta uma planilha na hora', 'Existe um relatório, mas costuma gerar discussão', 'Há um painel confiável e atualizado', 'Consultamos indicadores certificados, inclusive por pergunta']],
      ['Os indicadores têm definição e responsável?', ['Não, cada área calcula do seu jeito', 'Alguns têm, informalmente', 'A maioria tem definição documentada', 'Sim, com dicionário e donos validados']],
      ['Como estão os dados de clientes e vendas?', ['Espalhados entre WhatsApp, planilhas e sistemas', 'Em um sistema, mas incompletos', 'Em um CRM razoavelmente atualizado', 'Integrados, com histórico e segmentação']],
      ['As reuniões de gestão são guiadas por dados?', ['Raramente', 'Às vezes, quando alguém traz um número', 'Com frequência, com pauta de indicadores', 'Sempre, com ações acompanhadas']],
      ['Como a empresa usa automação e IA hoje?', ['Não usa', 'Testes isolados ou ferramentas soltas', 'Algumas automações em processos', 'IA e agentes conectados às regras do negócio']],
    ];
    const levels = [
      ['Intuitivo', 'As decisões dependem principalmente da experiência e da memória das pessoas. O primeiro passo é organizar as informações essenciais e definir poucos indicadores confiáveis.', 'Diagnóstico + indicadores essenciais', 'cdo'],
      ['Reativo', 'Há dados, mas eles chegam tarde ou geram discussão. O ganho mais rápido está em certificar indicadores e criar um ritual de decisão.', 'Governança de indicadores + BI', 'governanca'],
      ['Estruturado', 'A base existe. O próximo salto é dar autonomia às áreas e conectar o comercial à inteligência.', 'Analytics autônomo + CRM', 'bi'],
      ['Analítico', 'Indicadores confiáveis e uso frequente. É hora de antecipar: previsões, agentes ativos e automações orientadas a resultado.', 'Agentes ativos + Ciência de dados', 'agentes'],
      ['Orientado por dados', 'A empresa já decide com evidência. A GSA pode apoiar a evolução contínua e a governança da IA.', 'CDO consultivo para evolução contínua', 'cdo'],
    ];
    const stage = $('.quiz-stage', root), res = $('.quiz-result', root), bar = $('.quiz-progress span', root);
    const ans = [];
    const ask = (i) => {
      bar.style.width = `${(i / Q.length) * 100}%`;
      const [q, opts] = Q[i];
      stage.replaceChildren(h('p', { class: 'mono gold' }, `Pergunta ${i + 1} de ${Q.length}`), h('h3', { class: 'quiz-q' }, q),
        h('div', { class: 'quiz-opts' }, opts.map((o, j) => h('button', { class: 'quiz-opt', type: 'button', onclick: () => { ans[i] = j; i + 1 < Q.length ? ask(i + 1) : done(); } }, h('span', { class: 'k' }, 'ABCD'[j]), o))),
        h('div', { class: 'quiz-nav' }, i > 0 ? h('button', { type: 'button', onclick: () => ask(i - 1) }, '← Voltar') : h('span'), h('span', {}, 'Nenhum dado é enviado')));
      const first = $('.quiz-opt', stage); if (i > 0) first.focus();
    };
    const done = () => {
      bar.style.width = '100%';
      const score = ans.reduce((a, b) => a + b, 0) / (Q.length * 3);
      const lv = Math.min(4, Math.floor(score * 5));
      const [name, text, start, interest] = levels[lv];
      stage.replaceChildren();
      res.classList.add('on');
      res.replaceChildren(h('p', { class: 'mono gold' }, 'Leitura inicial'), h('h3', { class: 'quiz-q' }, `Estágio: ${name}`),
        h('div', { class: 'maturity-scale', 'aria-hidden': 'true' }, levels.map((l, j) => h('div', { class: j === lv ? 'on' : '' }, l[0]))),
        h('p', { class: 'body-copy' }, text), h('p', {}, h('b', {}, 'Ponto de partida sugerido: '), start),
        h('div', { class: 'actions mt-m' }, h('a', { class: 'btn btn-dark', href: `contato.html?interesse=${interest}&maturidade=${encodeURIComponent(name)}` }, 'Conversar sobre este resultado'),
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { res.classList.remove('on'); ans.length = 0; ask(0); } }, 'Refazer')));
      res.querySelector('h3').setAttribute('tabindex', '-1'); res.querySelector('h3').focus();
    };
    ask(0);
  });

  /* ---------------- Formulário de contato ---------------- */
  const form = $('[data-form]');
  if (form) {
    const qs = new URLSearchParams(location.search);
    const interest = qs.get('interesse'), seg = qs.get('segmento'), mat = qs.get('maturidade');
    if (interest) { const cb = form.querySelector(`input[name="interesse"][value="${CSS.escape(interest)}"]`); if (cb) cb.checked = true; }
    if (seg) { const opt = form.querySelector(`#f-seg option[value="${CSS.escape(seg)}"]`); if (opt) opt.selected = true; }
    if (mat) $('#f-msg').value = `Fiz o diagnóstico rápido no site e o resultado foi "${mat}". Gostaria de entender os próximos passos.`;

    const msgs = { valueMissing: 'Campo obrigatório.', typeMismatch: 'Informe um e-mail válido.' };
    const check = (input) => {
      const f = input.closest('.field'); if (!f || input.type === 'checkbox') return input.validity.valid;
      const err = $('.err', f); const ok = input.validity.valid;
      f.dataset.invalid = String(!ok); if (err) err.textContent = ok ? '' : (input.validity.valueMissing ? msgs.valueMissing : msgs.typeMismatch);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    $$('input[required], select[required], textarea[required]', form).forEach((i) => i.addEventListener('blur', () => check(i)));
    const status = $('.form-status', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let first = null;
      $$('input[required], select[required], textarea[required]', form).forEach((i) => { if (!check(i) && !first) first = i; });
      const consent = form.elements.consentimento, ce = $('[data-err="consent"]', form);
      ce.textContent = consent.checked ? '' : 'É preciso autorizar o uso dos dados para responder.';
      if (!consent.checked && !first) first = consent;
      if (first) { first.focus(); return; }
      const btn = $('button[type="submit"]', form); btn.disabled = true;
      status.className = 'form-status'; status.textContent = '';
      if (form.dataset.host !== 'netlify') {
        // Hospedagem estática (GitHub Pages): a mensagem segue pelo WhatsApp ou e-mail do visitante, já preenchida.
        const fd = new FormData(form), get = (k) => (fd.get(k) || '').toString().trim();
        const segTxt = $('#f-seg').selectedOptions[0]?.textContent || '';
        const ints = $$('input[name="interesse"]:checked', form).map((i) => i.nextElementSibling.textContent).join(', ');
        const text = [`Olá, GSA! Sou ${get('nome')}${get('cargo') ? `, ${get('cargo')}` : ''}, da ${get('empresa')}.`, `Segmento: ${segTxt}.`, ints && `Interesse: ${ints}.`, '', get('mensagem'), '', `E-mail: ${get('email')}${get('whatsapp') ? ` · WhatsApp: ${get('whatsapp')}` : ''}`].filter((x) => x !== false && x !== undefined).join('\n');
        const wa = form.dataset.whatsapp, mail = form.dataset.email;
        const url = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : mail ? `mailto:${mail}?subject=${encodeURIComponent('Contato pelo site — ' + get('empresa'))}&body=${encodeURIComponent(text)}` : '';
        if (url) {
          window.open(url, '_blank', 'noopener');
          status.className = 'form-status ok';
          status.textContent = wa ? 'Abrimos o WhatsApp com a sua mensagem pronta. É só confirmar o envio por lá.' : 'Abrimos o seu e-mail com a mensagem pronta. É só confirmar o envio.';
        } else {
          status.className = 'form-status fail';
          status.textContent = 'Canal de contato ainda não configurado.';
        }
        btn.disabled = false;
        return;
      }
      try {
        const body = new URLSearchParams(new FormData(form)).toString();
        const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (!r.ok) throw new Error(r.status);
        location.href = 'obrigado.html';
      } catch {
        status.className = 'form-status fail';
        status.textContent = 'Não foi possível enviar agora. Tente novamente em instantes. ';
        btn.disabled = false;
      }
    });
  }
})();
