/* ============================================================
   DegreeFlow — /problem-solution
   Scroll reveals, research visualisations, the transition
   simulator and the small course map.
   ============================================================ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* =========================================================
     1. Scroll reveals — one observer drives every section
     ========================================================= */
  const onView = (el, fn, threshold = 0.2) => {
    if (!el) return;
    if (reduceMotion) { fn(el); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        fn(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold });
    io.observe(el);
  };

  $$('.reveal').forEach(el => onView(el, n => n.classList.add('is-in'), 0.15));

  /* =========================================================
     2. Hero: draw the fragmented pathway
     ========================================================= */
  $$('.fe').forEach((path, i) => {
    if (typeof path.getTotalLength !== 'function') return;
    try {
      const len = path.getTotalLength();
      path.style.setProperty('--len', len);
      path.style.setProperty('--d', i);
    } catch (e) { /* geometry unavailable */ }
  });

  /* =========================================================
     3. Domino chain — steps light in sequence, then loop
     ========================================================= */
  (function domino() {
    const wrap = $('#domino');
    if (!wrap) return;
    const steps = $$('.dom', wrap);
    if (reduceMotion) { steps.forEach(s => s.classList.add('is-on')); return; }

    let timer = null;
    const run = () => {
      steps.forEach(s => s.classList.remove('is-on'));
      steps.forEach((s, i) => setTimeout(() => s.classList.add('is-on'), 260 + i * 420));
    };
    onView(wrap, () => {
      run();
      timer = setInterval(run, 5200);
    }, 0.4);

    /* pause the loop when the section is off screen */
    const pause = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !timer) { run(); timer = setInterval(run, 5200); }
        if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
      });
    }, { threshold: 0.2 });
    pause.observe(wrap);
  })();

  /* =========================================================
     4. Research visualisations
     ========================================================= */
  /* percentage rings */
  $$('.ring').forEach(ring => {
    const pct = Number(ring.dataset.pct);
    const fg = $('.ring-fg', ring);
    const num = $('.ring-num', ring);
    const circumference = 327;   /* 2πr, r = 52 */

    onView(ring, () => {
      if (fg) fg.style.strokeDashoffset = circumference * (1 - pct / 100);
      if (!num) return;
      if (reduceMotion) { num.innerHTML = pct + '<i>%</i>'; return; }
      const started = performance.now();
      const tick = now => {
        const t = Math.min((now - started) / 1400, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        num.innerHTML = Math.round(pct * eased) + '<i>%</i>';
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 0.4);
  });

  /* field-of-study bars */
  (function bars() {
    const wrap = $('#bars');
    if (!wrap) return;
    const rows = $$('.bar-row', wrap);
    const max = Math.max(...rows.map(r => Number(r.dataset.val)));
    onView(wrap, () => {
      rows.forEach((row, i) => {
        const fill = $('i', row);
        fill.style.setProperty('--d', i);
        fill.style.width = (Number(row.dataset.val) / max * 100) + '%';
      });
    }, 0.25);
  })();

  /* =========================================================
     5. Solution: small course map
     ========================================================= */
  (function miniGraph() {
    const svg = $('#miniGraph');
    if (!svg) return;
    const EDGES = $$('.mg-edges path', svg).map(p => [p.dataset.from, p.dataset.to, p]);
    const nodes = $$('.mg', svg);

    const walk = (id, dir) => {
      const found = new Set([id]);
      let grew = true;
      while (grew) {
        grew = false;
        EDGES.forEach(([f, t]) => {
          const from = dir === 'up' ? t : f;
          const to = dir === 'up' ? f : t;
          if (found.has(from) && !found.has(to)) { found.add(to); grew = true; }
        });
      }
      return found;
    };

    const clear = () => {
      nodes.forEach(n => n.classList.remove('is-lit', 'is-dim'));
      EDGES.forEach(([, , p]) => p.classList.remove('is-lit', 'is-dim'));
    };

    const light = id => {
      const chain = new Set([...walk(id, 'up'), ...walk(id, 'down')]);
      nodes.forEach(n => {
        n.classList.toggle('is-lit', chain.has(n.dataset.id));
        n.classList.toggle('is-dim', !chain.has(n.dataset.id));
      });
      EDGES.forEach(([f, t, p]) => {
        const inChain = chain.has(f) && chain.has(t);
        p.classList.toggle('is-lit', inChain);
        p.classList.toggle('is-dim', !inChain);
      });
    };

    nodes.forEach(n => {
      n.tabIndex = 0;
      n.addEventListener('mouseenter', () => light(n.dataset.id));
      n.addEventListener('focus', () => light(n.dataset.id));
      n.addEventListener('blur', clear);
    });
    svg.addEventListener('mouseleave', clear);
  })();

  /* =========================================================
     6. Transition simulator
     Illustrative Computer Science → Mathematics example,
     matching the course data used on the Explore page.
     ========================================================= */
  (function simulator() {
    const host = $('#sim');
    if (!host) return;
    const chipBox = $('#simChips');
    const read = $('#simRead');
    const tabs = $$('.sim-tab', host);

    const DONE = [
      { code: 'MATH 101', name: 'Calculus I', cr: 3, fate: 'keep' },
      { code: 'MATH 102', name: 'Calculus II', cr: 3, fate: 'keep' },
      { code: 'MATH 210', name: 'Linear Algebra', cr: 3, fate: 'keep' },
      { code: 'STAT 210', name: 'Probability', cr: 3, fate: 'keep' },
      { code: 'PHYS 101', name: 'Physics I', cr: 4, fate: 'keep' },
      { code: 'ENG 101', name: 'Academic Writing', cr: 3, fate: 'keep' },
      { code: 'CS 101', name: 'Programming I', cr: 3, fate: 'elec' },
      { code: 'CS 102', name: 'Programming II', cr: 3, fate: 'elec' },
      { code: 'CS 140', name: 'Discrete Structures', cr: 3, fate: 'elec' },
      { code: 'CS 201', name: 'Data Structures', cr: 3, fate: 'elec' }
    ];
    const NEW = [
      { code: 'MATH 150', name: 'Foundations of Mathematics', cr: 3 },
      { code: 'MATH 205', name: 'Differential Equations', cr: 3 },
      { code: 'MATH 220', name: 'Real Analysis I', cr: 3 },
      { code: 'MATH 301', name: 'Abstract Algebra', cr: 3 },
      { code: 'MATH 320', name: 'Numerical Methods', cr: 3 }
    ];

    const sum = (list, fate) => list
      .filter(c => !fate || c.fate === fate)
      .reduce((n, c) => n + c.cr, 0);

    const keepCr = sum(DONE, 'keep');
    const elecCr = sum(DONE, 'elec');
    const newCr = sum(NEW);
    const totalCr = sum(DONE);

    const STAGES = [
      {
        read: `<strong>${totalCr} credits</strong> completed so far across ${DONE.length} courses.`,
        chip: () => 'on', extra: false
      },
      {
        read: `<strong>${keepCr} of ${totalCr} credits</strong> still count directly toward the Mathematics major.`,
        chip: c => c.fate === 'keep' ? 'keep' : 'off', extra: false
      },
      {
        read: `<strong>${elecCr} credits</strong> of programming coursework carry over as general electives rather than major requirements.`,
        chip: c => c.fate === 'elec' ? 'elec' : 'off', extra: false
      },
      {
        read: `<strong>${NEW.length} new requirements</strong> (${newCr} credits) appear that the Computer Science path never included.`,
        chip: () => 'off', extra: true
      },
      {
        read: `Net effect: <strong>${keepCr} credits</strong> transfer, <strong>${elecCr}</strong> become electives, <strong>${newCr}</strong> are added. Graduation stays within four years if two of the new requirements are taken next semester.`,
        chip: c => c.fate === 'keep' ? 'keep' : 'elec', extra: true
      }
    ];

    let stage = 0;
    let auto = null;

    function draw() {
      const s = STAGES[stage];
      chipBox.textContent = '';
      let i = 0;

      DONE.forEach(c => {
        const el = document.createElement('span');
        el.className = 'chip-c ' + s.chip(c);
        el.style.setProperty('--d', i++);
        el.textContent = c.code;
        el.title = c.name;
        chipBox.appendChild(el);
      });

      if (s.extra) {
        NEW.forEach(c => {
          const el = document.createElement('span');
          el.className = 'chip-c new';
          el.style.setProperty('--d', i++);
          el.textContent = c.code;
          el.title = c.name;
          chipBox.appendChild(el);
        });
      }

      read.innerHTML = s.read;
      tabs.forEach((t, n) => {
        t.classList.toggle('is-on', n === stage);
        t.setAttribute('aria-selected', String(n === stage));
      });
    }

    function go(n, manual) {
      stage = (n + STAGES.length) % STAGES.length;
      draw();
      if (manual && auto) { clearInterval(auto); auto = null; }
    }

    tabs.forEach(t => t.addEventListener('click', () => go(Number(t.dataset.stage), true)));
    draw();

    /* advance on its own until the visitor takes over */
    if (!reduceMotion) {
      onView(host, () => {
        auto = setInterval(() => { if (auto) go(stage + 1); }, 3200);
      }, 0.35);
    }
  })();

  /* =========================================================
     7. Uncertainty → clarity
     ========================================================= */
  (function clarity() {
    const wrap = $('#clarity');
    const field = $('#clarityField');
    if (!field) return;

    const COUNT = 26;
    let seed = 20260913;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

    const dots = [];
    for (let i = 0; i < COUNT; i++) {
      const d = document.createElement('i');
      d.style.setProperty('--d', i);
      d.style.left = (rand() * 96) + '%';
      d.style.top = (rand() * 84) + '%';
      field.appendChild(d);
      dots.push(d);
    }

    onView(wrap, () => {
      wrap.classList.add('is-in');
      dots.forEach((d, i) => {
        /* settle into an even, rising line */
        d.style.left = ((i / (COUNT - 1)) * 96) + '%';
        d.style.top = (66 - (i / (COUNT - 1)) * 52) + '%';
      });
    }, 0.35);
  })();

  /* =========================================================
     8. Site chrome: nav, magnetic buttons, drifting orbs
     ========================================================= */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = $('#navToggle');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    $('#navLinks').classList.toggle('is-open', !open);
  });
  $('#navLinks').addEventListener('click', e => {
    if (e.target.closest('a')) {
      $('#navLinks').classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  if (!reduceMotion) {
    const orbs = $$('.orb').map((o, i) => ({ el: o, k: 0.04 + i * 0.02 }));
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        orbs.forEach(o => { o.el.style.translate = '0 ' + (-window.scrollY * o.k).toFixed(1) + 'px'; });
        ticking = false;
      });
    }, { passive: true });
  }
})();
