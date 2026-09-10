/* ============================================================
   DegreeFlow — homepage behaviour
   - builds the prerequisite graph from a real course model
   - traces dependencies on hover / focus / tap
   - orchestrates a single page-load reveal
   ============================================================ */

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  /* safety: never leave the page scroll-locked if something above fails */
  setTimeout(() => document.documentElement.classList.remove('is-loading'), 6000);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Course model
     x/y = full layout, cx/cy = compact (mobile) layout
     --------------------------------------------------------- */
  const COURSES = [
    { id: 'cs110',   code: 'CS 110',   name: 'Programming Foundations', state: 'done',   term: 'Fall 2024',   x: 50,  y: 120, cx: 90,  cy: 60,  compact: true },
    { id: 'math121', code: 'MATH 121', name: 'Calculus I',              state: 'done',   term: 'Fall 2024',   x: 50,  y: 285, cx: 250, cy: 60,  compact: true },
    { id: 'cs150',   code: 'CS 150',   name: 'Discrete Mathematics',    state: 'done',   term: 'Spring 2025', x: 50,  y: 415 },
    { id: 'cs210',   code: 'CS 210',   name: 'Data Structures',         state: 'done',   term: 'Spring 2025', x: 180, y: 95,  cx: 90,  cy: 180, compact: true },
    { id: 'math210', code: 'MATH 210', name: 'Linear Algebra',          state: 'done',   term: 'Fall 2025',   x: 180, y: 265, cx: 250, cy: 180, compact: true },
    { id: 'stat260', code: 'STAT 260', name: 'Probability & Statistics',state: 'active', term: 'this term',   x: 180, y: 395 },
    { id: 'cs240',   code: 'CS 240',   name: 'Algorithms',              state: 'active', term: 'this term',   x: 310, y: 75,  cx: 90,  cy: 300, compact: true },
    { id: 'math302', code: 'MATH 302', name: 'Real Analysis II',        state: 'open',                        x: 310, y: 235, cx: 250, cy: 300, compact: true },
    { id: 'cs265',   code: 'CS 265',   name: 'Systems Programming',     state: 'open',                        x: 310, y: 378 },
    { id: 'cs350',   code: 'CS 350',   name: 'Machine Learning',        state: 'locked',                      x: 440, y: 150 },
    { id: 'cs410',   code: 'CS 410',   name: 'Distributed Systems',     state: 'locked',                      x: 440, y: 318, cx: 170, cy: 405, compact: true },
    { id: 'cs490',   code: 'CS 490',   name: 'Capstone Project',        state: 'locked',                      x: 570, y: 190, cx: 170, cy: 505, compact: true },
    { id: 'degree',  code: 'Degree',   name: 'B.S. Computer Science',   state: 'degree',                      x: 570, y: 395, cx: 170, cy: 600, compact: true }
  ];

  const PREREQS = [
    ['cs110', 'cs210'], ['cs110', 'cs265'],
    ['math121', 'math210'], ['math121', 'stat260'],
    ['cs150', 'stat260'], ['cs150', 'cs265'],
    ['cs210', 'cs240'],
    ['math210', 'math302'],
    ['stat260', 'cs350'], ['cs240', 'cs350'],
    ['cs240', 'cs410'], ['math302', 'cs410'], ['cs265', 'cs410'],
    ['cs350', 'cs490'], ['cs410', 'cs490'],
    ['cs490', 'degree']
  ];

  const byId = Object.fromEntries(COURSES.map(c => [c.id, c]));

  const STATE_TEXT = {
    done:   c => 'Completed · ' + c.term,
    active: c => 'In progress · ' + c.term,
    open:   () => 'Prerequisites met',
    locked: c => {
      const missing = PREREQS.filter(e => e[1] === c.id && byId[e[0]].state !== 'done').length;
      return missing === 1 ? 'Locked · 1 prerequisite left' : 'Locked · ' + missing + ' prerequisites left';
    },
    degree: () => '120 credits · May 2028'
  };

  /* ---------------------------------------------------------
     2. Graph rendering
     --------------------------------------------------------- */
  const svg = document.getElementById('graph');
  const edgeLayer = document.getElementById('edgeLayer');
  const nodeLayer = document.getElementById('nodeLayer');
  const stage = document.getElementById('stage');
  const card = document.getElementById('nodeCard');
  const hint = document.getElementById('stageHint');

  const compactQuery = window.matchMedia('(max-width: 700px)');
  let mode = compactQuery.matches ? 'compact' : 'full';
  let nodeEls = new Map();
  let edgeEls = [];
  let activeId = null;
  let introStarted = false;

  function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function visibleCourses() {
    return mode === 'compact' ? COURSES.filter(c => c.compact) : COURSES;
  }

  function pos(c) {
    return mode === 'compact' ? { x: c.cx, y: c.cy } : { x: c.x, y: c.y };
  }

  function curve(a, b) {
    const p1 = pos(a), p2 = pos(b);
    const dx = (p2.x - p1.x) * 0.45;
    const dy = (p2.y - p1.y) * 0.4;
    if (mode === 'compact') {
      return `M${p1.x},${p1.y} C${p1.x},${p1.y + dy} ${p2.x},${p2.y - dy} ${p2.x},${p2.y}`;
    }
    return `M${p1.x},${p1.y} C${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`;
  }

  function edgeState(a, b) {
    if (a.state === 'done' && (b.state === 'done' || b.state === 'active' || b.state === 'open')) return 'done';
    if (a.state === 'active' || b.state === 'active') return 'active';
    return 'idle';
  }

  function build() {
    edgeLayer.textContent = '';
    nodeLayer.textContent = '';
    nodeEls = new Map();
    edgeEls = [];
    activeId = null;

    const shown = visibleCourses();
    const ids = new Set(shown.map(c => c.id));
    svg.setAttribute('viewBox', mode === 'compact' ? '0 0 340 650' : '0 0 640 560');

    PREREQS.filter(([f, t]) => ids.has(f) && ids.has(t)).forEach(([f, t]) => {
      const path = el('path', {
        class: 'edge state-' + edgeState(byId[f], byId[t]),
        d: curve(byId[f], byId[t])
      });
      path.dataset.from = f;
      path.dataset.to = t;
      edgeLayer.appendChild(path);
      edgeEls.push(path);
    });

    shown.forEach(c => {
      const p = pos(c);
      const wrap = el('g', { class: 'node-pos', transform: `translate(${p.x} ${p.y})` });
      const g = el('g', {
        class: 'node state-' + c.state,
        tabindex: '0',
        role: 'button',
        'aria-label': `${c.code}, ${c.name}. ${STATE_TEXT[c.state](c)}`
      });
      g.dataset.id = c.id;

      const isDegree = c.state === 'degree';
      g.appendChild(el('circle', { class: 'halo', r: isDegree ? 30 : 22 }));
      g.appendChild(el('circle', { class: 'ring', r: isDegree ? 15 : 11.5 }));

      if (isDegree) {
        g.appendChild(el('path', {
          class: 'core',
          d: 'M0,-9.5 L8.2,-4.75 L8.2,4.75 L0,9.5 L-8.2,4.75 L-8.2,-4.75 Z'
        }));
      } else {
        g.appendChild(el('circle', { class: 'core', r: c.state === 'open' ? 6 : 6.5 }));
      }

      const label = el('text', { class: 'label', y: isDegree ? 34 : 29 });
      label.textContent = c.code;
      g.appendChild(label);

      wrap.appendChild(g);
      nodeLayer.appendChild(wrap);
      nodeEls.set(c.id, g);
    });

    wireInteractions();
    if (introStarted) reveal();
  }

  /* ---------------------------------------------------------
     3. Dependency tracing
     --------------------------------------------------------- */
  function walk(id, dir) {
    const found = new Set();
    const queue = [id];
    while (queue.length) {
      const current = queue.pop();
      PREREQS.forEach(([f, t]) => {
        const from = dir === 'up' ? t : f;
        const to = dir === 'up' ? f : t;
        if (from === current && !found.has(to)) {
          found.add(to);
          queue.push(to);
        }
      });
    }
    return found;
  }

  function highlight(id) {
    const chain = new Set([id, ...walk(id, 'up'), ...walk(id, 'down')]);
    nodeEls.forEach((g, key) => {
      g.classList.toggle('is-lit', chain.has(key) && key !== id);
      g.classList.toggle('is-dim', !chain.has(key));
      g.classList.toggle('is-hover', key === id);
    });
    edgeEls.forEach(p => {
      const inChain = chain.has(p.dataset.from) && chain.has(p.dataset.to);
      p.classList.toggle('is-lit', inChain);
      p.classList.toggle('is-dim', !inChain);
    });
    showCard(id);
    hint.classList.add('is-hidden');
  }

  function clear() {
    nodeEls.forEach(g => g.classList.remove('is-lit', 'is-dim', 'is-hover'));
    edgeEls.forEach(p => p.classList.remove('is-lit', 'is-dim'));
    card.classList.remove('is-visible');
    hint.classList.remove('is-hidden');
    activeId = null;
  }

  function showCard(id) {
    const c = byId[id];
    const unlocks = PREREQS.filter(e => e[0] === id).length;
    const p = pos(c);
    const vb = svg.viewBox.baseVal;
    const svgRect = svg.getBoundingClientRect();
    const rect = stage.getBoundingClientRect();
    const scale = svgRect.width / vb.width;
    const offsetX = svgRect.left - rect.left;
    const offsetY = svgRect.top - rect.top;

    document.getElementById('ncCode').textContent = c.code;
    document.getElementById('ncName').textContent = c.name;
    document.getElementById('ncState').textContent = STATE_TEXT[c.state](c);
    const unlockEl = document.getElementById('ncUnlock');
    unlockEl.textContent = unlocks
      ? 'Unlocks ' + unlocks + (unlocks === 1 ? ' course' : ' courses')
      : 'End of the path';
    card.dataset.state = c.state;

    card.classList.add('is-visible');
    const cardWidth = card.offsetWidth;
    const half = cardWidth / 2 + 8;
    const left = Math.min(Math.max(p.x * scale + offsetX, half), rect.width - half);
    const top = p.y * scale + offsetY - 22;
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function wireInteractions() {
    nodeEls.forEach((g, id) => {
      g.addEventListener('mouseenter', () => { activeId = id; highlight(id); });
      g.addEventListener('focus', () => { activeId = id; highlight(id); });
      g.addEventListener('blur', clear);
      g.addEventListener('click', e => {
        e.stopPropagation();
        if (activeId === id) { clear(); } else { activeId = id; highlight(id); }
      });
      g.addEventListener('keydown', e => {
        if (e.key === 'Escape') { clear(); g.blur(); }
      });
    });
    stage.addEventListener('mouseleave', clear);
  }

  /* ---------------------------------------------------------
     4. Page-load reveal for the graph
     --------------------------------------------------------- */
  function reveal() {
    const order = visibleCourses()
      .slice()
      .sort((a, b) => (pos(a).x - pos(b).x) || (pos(a).y - pos(b).y));

    if (reduceMotion) {
      order.forEach(c => nodeEls.get(c.id).classList.add('is-on'));
      edgeEls.forEach(p => { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = 0; });
      svg.classList.add('is-ready');
      return;
    }

    edgeEls.forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.transition = 'stroke-dashoffset 1.05s cubic-bezier(.16,1,.3,1), stroke .35s ease, opacity .35s ease, stroke-width .35s ease';
    });

    order.forEach((c, i) => {
      const g = nodeEls.get(c.id);
      g.style.transitionDelay = (420 + i * 68) + 'ms';
      requestAnimationFrame(() => g.classList.add('is-on'));
    });

    edgeEls.forEach((p, i) => {
      setTimeout(() => { p.style.strokeDashoffset = 0; }, 620 + i * 55);
    });

    setTimeout(() => svg.classList.add('is-ready'), 1800);
  }

  build();

  let lastMode = mode;
  const onBreakpoint = () => {
    const next = compactQuery.matches ? 'compact' : 'full';
    if (next !== lastMode) { lastMode = mode = next; build(); }
  };
  if (compactQuery.addEventListener) compactQuery.addEventListener('change', onBreakpoint);
  else compactQuery.addListener(onBreakpoint);

  /* ---------------------------------------------------------
     5. Navigation
     --------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    links.classList.toggle('is-open', !open);
  });

  links.addEventListener('click', e => {
    if (e.target.closest('a')) {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* current-section highlighting */
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const sections = ['hero', 'how'].map(id => document.getElementById(id)).filter(Boolean);
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navObserver.observe(s));

  /* ---------------------------------------------------------
     6. Section reveals
     --------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('.reveal').forEach(n => revealObserver.observe(n));

  /* ---------------------------------------------------------
     7. Preloader + orchestrated hero entrance
     --------------------------------------------------------- */
  const heroTitle = document.getElementById('heroTitle');
  [...heroTitle.querySelectorAll('.line-in')].forEach((l, i) => l.style.setProperty('--l', i));

  const seqNodes = [...document.querySelectorAll('[data-seq]')];
  if (!reduceMotion) {
    seqNodes.forEach(node => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(16px)';
      node.style.transition = 'opacity .9s cubic-bezier(.19,1,.22,1), transform .9s cubic-bezier(.19,1,.22,1)';
      node.style.transitionDelay = (Number(node.dataset.seq) * 85) + 'ms';
    });
  }

  function countUp(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
    const started = performance.now();
    const dur = 1500;
    const tick = now => {
      const t = Math.min((now - started) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function startIntro() {
    document.documentElement.classList.remove('is-loading');
    introStarted = true;
    heroTitle.classList.add('is-in');
    seqNodes.forEach(node => { node.style.opacity = '1'; node.style.transform = 'none'; });
    reveal();
    setTimeout(() => document.querySelectorAll('[data-count]').forEach(countUp), 700);
  }

  (function preload() {
    const pre = document.getElementById('preloader');
    const num = document.getElementById('preCount');
    const bar = document.getElementById('preBar');

    if (reduceMotion) {
      pre.remove();
      startIntro();
      return;
    }

    let value = 0;
    const step = () => {
      value = Math.min(value + Math.random() * 9 + 3, 100);
      num.textContent = Math.floor(value);
      bar.style.width = value + '%';
      if (value < 100) {
        setTimeout(step, 70 + Math.random() * 90);
      } else {
        setTimeout(() => {
          pre.classList.add('is-done');
          startIntro();
          setTimeout(() => pre.remove(), 1200);
        }, 280);
      }
    };
    setTimeout(step, 220);
  })();

  /* ---------------------------------------------------------
     7b. Magnetic buttons + drifting background parallax
     --------------------------------------------------------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.32;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  if (!reduceMotion) {
    const orbs = [...document.querySelectorAll('.orb')].map((o, i) => ({ el: o, k: 0.045 + i * 0.022 }));
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        orbs.forEach(o => { o.el.style.translate = '0 ' + (-y * o.k).toFixed(1) + 'px'; });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     7c. Prerequisite ticker
     --------------------------------------------------------- */
  (function ticker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    const chains = PREREQS.map(([f, t]) => [byId[f].code, byId[t].code]);
    const row = document.createDocumentFragment();
    const make = () => chains.forEach(([a, b]) => {
      const item = document.createElement('span');
      item.className = 'ticker-item';
      item.innerHTML = `${a} <span class="tick-arrow">→</span> ${b}<i class="tick-dot"></i>`;
      row.appendChild(item);
    });
    make(); make();
    track.appendChild(row);
  })();

  /* ---------------------------------------------------------
     8. Background network behind the closing CTA
     --------------------------------------------------------- */
  (function ctaNetwork() {
    const net = document.getElementById('ctaNet');
    if (!net) return;

    let seed = 20260909;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

    const pts = [];
    const cols = 9, rows = 5;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        pts.push({
          x: 60 + c * (1080 / (cols - 1)) + (rand() - 0.5) * 62,
          y: 60 + r * (500 / (rows - 1)) + (rand() - 0.5) * 58
        });
      }
    }

    const frag = document.createDocumentFragment();
    pts.forEach((p, i) => {
      pts.slice(i + 1).forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 175) {
          const line = el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y });
          line.setAttribute('opacity', (1 - d / 175) * 0.55);
          frag.appendChild(line);
        }
      });
    });
    pts.forEach(p => {
      const lit = rand() > 0.76;
      const dot = el('circle', { cx: p.x, cy: p.y, r: lit ? 3.4 : 2.2 });
      if (lit) {
        dot.setAttribute('class', 'lit');
        dot.style.animationDelay = (rand() * 6).toFixed(2) + 's';
      }
      frag.appendChild(dot);
    });
    net.appendChild(frag);
  })();
})();
