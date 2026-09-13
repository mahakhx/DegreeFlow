/* ============================================================
   DegreeFlow — /problem-solution
   Scroll reveals, the branching hero, the question rotator,
   the degree map and the what-if simulator.
   ============================================================ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- shared: run once when scrolled into view ---------- */
  function onView(el, fn, threshold = 0.2) {
    if (!el) return;
    if (reduceMotion || typeof IntersectionObserver === 'undefined') { fn(el); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { fn(e.target); obs.unobserve(e.target); } });
    }, { threshold });
    io.observe(el);
  }

  $$('.reveal').forEach(el => onView(el, n => n.classList.add('is-in'), 0.15));

  /* =========================================================
     1. Hero: one degree branching into four futures
     ========================================================= */
  (function branches() {
    const svg = $('.branch');
    if (!svg) return;

    $$('.be', svg).forEach((p, i) => {
      if (typeof p.getTotalLength !== 'function') return;
      try {
        p.style.setProperty('--len', p.getTotalLength());
        p.style.setProperty('--d', i);
      } catch (e) { /* geometry unavailable */ }
    });

    const futures = $$('.bn.alt', svg);
    const edges = $$('.be', svg);

    const clear = () => {
      futures.forEach(f => f.classList.remove('lit', 'dim'));
      edges.forEach(e => e.classList.remove('lit', 'dim'));
    };

    const light = idx => {
      futures.forEach(f => {
        f.classList.toggle('lit', f.dataset.f === idx);
        f.classList.toggle('dim', f.dataset.f !== idx);
      });
      edges.forEach(e => {
        const on = e.classList.contains('spine') || e.dataset.f === idx;
        e.classList.toggle('lit', on);
        e.classList.toggle('dim', !on);
      });
    };

    futures.forEach(f => {
      f.addEventListener('mouseenter', () => light(f.dataset.f));
      f.addEventListener('focus', () => light(f.dataset.f));
      f.setAttribute('tabindex', '0');
    });
    svg.addEventListener('mouseleave', clear);

    /* cycle through the futures on its own until someone interacts */
    if (reduceMotion) return;
    let i = 0, auto = null;
    const stop = () => { if (auto) { clearInterval(auto); auto = null; clear(); } };
    svg.addEventListener('mouseenter', stop, { once: true });
    onView(svg, () => {
      auto = setInterval(() => { light(String(i % futures.length)); i += 1; }, 1900);
    }, 0.3);
  })();

  /* =========================================================
     2. The questions students actually ask
     ========================================================= */
  (function asker() {
    const el = $('#askQ');
    if (!el) return;
    const QS = [
      'What if I add a minor?',
      'What if I switch majors?',
      'What if I transfer universities?',
      'What if I move this course to next semester?',
      'Which of my credits would still count?'
    ];
    if (reduceMotion) return;
    let i = 0;
    setInterval(() => {
      el.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % QS.length;
        el.textContent = QS[i];
        el.classList.remove('out');
      }, 420);
    }, 3000);
  })();

  /* =========================================================
     3. Research counters and bars
     ========================================================= */
  $$('[data-count]').forEach(el => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = String(target).includes('.') ? 1 : 0;
    const fmt = v => (decimals ? v.toFixed(1) : Math.round(v).toLocaleString()) + suffix;

    onView(el, () => {
      if (reduceMotion) { el.textContent = fmt(target); return; }
      const t0 = performance.now();
      const tick = now => {
        const t = Math.min((now - t0) / 1500, 1);
        el.textContent = fmt(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 0.4);
  });

  onView($('#evBars'), wrap => {
    $$('.ev-row', wrap).forEach(row => { $('i', row).style.width = row.dataset.val + '%'; });
  }, 0.3);

  /* =========================================================
     4. The degree map — trace a course's chain
     ========================================================= */
  (function degreeMap() {
    const svg = $('#degMap');
    if (!svg) return;
    const EDGES = $$('.dm-edges path', svg).map(p => [p.dataset.from, p.dataset.to, p]);
    const nodes = $$('.dm', svg);

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
      nodes.forEach(n => n.classList.remove('lit', 'dim'));
      EDGES.forEach(([, , p]) => p.classList.remove('lit', 'dim'));
    };

    const light = id => {
      const chain = new Set([...walk(id, 'up'), ...walk(id, 'down')]);
      nodes.forEach(n => {
        n.classList.toggle('lit', chain.has(n.dataset.id));
        n.classList.toggle('dim', !chain.has(n.dataset.id));
      });
      EDGES.forEach(([f, t, p]) => {
        const on = chain.has(f) && chain.has(t);
        p.classList.toggle('lit', on);
        p.classList.toggle('dim', !on);
      });
    };

    nodes.forEach(n => {
      n.setAttribute('tabindex', '0');
      n.addEventListener('mouseenter', () => light(n.dataset.id));
      n.addEventListener('focus', () => light(n.dataset.id));
      n.addEventListener('blur', clear);
    });
    svg.addEventListener('mouseleave', clear);
  })();

  /* =========================================================
     5. What-if simulator
     Illustrative prototype figures — same course data as Explore.
     ========================================================= */
  (function simulator() {
    const host = $('.sim-card');
    if (!host) return;
    const flow = $('#simFlow');
    const label = $('#simLabel');
    const stats = $('#simStats');
    const tabs = $$('.sim-tab', host);

    const SCENARIOS = [
      {
        label: 'Computer Science → Mathematics',
        flow: [
          ['keep', 'Current path', '24 courses · BSc Computer Science'],
          ['keep', 'Courses that still count', '10 carry over, including the calculus sequence'],
          ['warn', 'No longer required', 'The programming track stops counting toward the major'],
          ['add', 'New requirements', '14 mathematics courses enter the plan'],
          ['keep', 'Updated pathway', 'Graduation stays within four years']
        ],
        stats: [['Courses carried over', '10'], ['New requirements', '14'], ['Credit difference', '+1']]
      },
      {
        label: 'Computer Science + Artificial Intelligence minor',
        flow: [
          ['keep', 'Current path', '120 credits · major requirements'],
          ['keep', 'Overlapping prerequisite', 'Data Structures already unlocks the first AI course'],
          ['add', 'Minor requirements', '6 AI courses branch off the core path'],
          ['keep', 'Updated pathway', 'Runs alongside the degree, no extra semester']
        ],
        stats: [['Courses added', '6'], ['Additional credits', '+18'], ['Extra semesters', '+0']]
      },
      {
        label: 'University of Sharjah → Khalifa University',
        flow: [
          ['keep', 'Credits completed', '43 credits at the current university'],
          ['keep', 'Likely to transfer', 'Courses relevant to the receiving degree'],
          ['warn', 'May need review', 'Equivalency review for 10 credits'],
          ['add', 'New requirements', 'A common-core sequence the old plan never had'],
          ['keep', 'Adjusted pathway', 'Rebuilt around the new structure']
        ],
        stats: [['Transferable', '33 cr'], ['May need review', '10 cr'], ['New requirements', '9 cr']]
      },
      {
        label: 'Move Database Management to semester 5',
        flow: [
          ['keep', 'Pick up a course', 'Drag it to a different semester'],
          ['warn', 'Check the chain', 'Its prerequisite must still come first'],
          ['add', 'Valid destinations', 'Only semesters that keep the chain intact light up'],
          ['keep', 'Path redraws', 'Connection lines follow the course to its new slot']
        ],
        stats: [['Prerequisites checked', 'Live'], ['Invalid moves', 'Blocked'], ['Plan saved', 'Yes']]
      }
    ];

    function draw(n) {
      const s = SCENARIOS[n];
      label.textContent = s.label;

      flow.textContent = '';
      s.flow.forEach(([kind, head, detail], i) => {
        const row = document.createElement('div');
        row.className = 'flow-row ' + kind;
        row.style.setProperty('--d', i);
        row.innerHTML = `<span class="fi"></span><span><b>${head}</b> <span class="ft">— ${detail}</span></span>`;
        flow.appendChild(row);
      });

      stats.textContent = '';
      s.stats.forEach(([k, v], i) => {
        const box = document.createElement('div');
        box.className = 'sim-stat';
        box.style.setProperty('--d', i);
        box.innerHTML = `<span>${k}</span><b>${v}</b>`;
        stats.appendChild(box);
      });

      tabs.forEach((t, i) => {
        t.classList.toggle('is-on', i === n);
        t.setAttribute('aria-selected', String(i === n));
      });
    }

    let current = 0, auto = null;
    tabs.forEach((t, i) => t.addEventListener('click', () => {
      current = i;
      draw(i);
      if (auto) { clearInterval(auto); auto = null; }
    }));

    draw(0);
    if (!reduceMotion) {
      onView(host, () => {
        auto = setInterval(() => {
          if (!auto) return;
          current = (current + 1) % SCENARIOS.length;
          draw(current);
        }, 5200);
      }, 0.3);
    }
  })();

  /* =========================================================
     6. Site chrome
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
