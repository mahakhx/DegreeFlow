/* ============================================================
   DegreeFlow — /explore
   Interactive pathway simulator. Prototype data, real logic:
   prerequisite state, unlocking, and drag validation are all
   computed from the course model below.
   ============================================================ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* =========================================================
     Course model
     ========================================================= */
  const SEMESTERS = [
    { n: 1, year: 1, label: 'Semester 1', term: 'Fall · Year 1' },
    { n: 2, year: 1, label: 'Semester 2', term: 'Spring · Year 1' },
    { n: 3, year: 2, label: 'Semester 3', term: 'Fall · Year 2' },
    { n: 4, year: 2, label: 'Semester 4', term: 'Spring · Year 2' },
    { n: 5, year: 3, label: 'Semester 5', term: 'Fall · Year 3' }
  ];

  const BASE_COURSES = [
    { id: 'math101', code: 'MATH 101', name: 'Calculus I',              cr: 3, sem: 1, state: 'done' },
    { id: 'cs101',   code: 'CS 101',   name: 'Programming I',           cr: 3, sem: 1, state: 'done' },
    { id: 'phys101', code: 'PHYS 101', name: 'Physics I',               cr: 4, sem: 1, state: 'done' },
    { id: 'math102', code: 'MATH 102', name: 'Calculus II',             cr: 3, sem: 2, state: 'done' },
    { id: 'cs102',   code: 'CS 102',   name: 'Programming II',          cr: 3, sem: 2, state: 'done' },
    { id: 'cs140',   code: 'CS 140',   name: 'Discrete Structures',     cr: 3, sem: 2, state: 'done' },
    { id: 'cs201',   code: 'CS 201',   name: 'Data Structures',         cr: 3, sem: 3, state: 'active' },
    { id: 'math210', code: 'MATH 210', name: 'Linear Algebra',          cr: 3, sem: 3, state: 'active' },
    { id: 'cs220',   code: 'CS 220',   name: 'Database Management',     cr: 3, sem: 4, state: 'auto' },
    { id: 'cs240',   code: 'CS 240',   name: 'Algorithms',              cr: 3, sem: 4, state: 'auto' },
    { id: 'cs301',   code: 'CS 301',   name: 'Artificial Intelligence', cr: 3, sem: 5, state: 'auto' },
    { id: 'cs310',   code: 'CS 310',   name: 'Operating Systems',       cr: 3, sem: 5, state: 'auto' }
  ];

  const BASE_EDGES = [
    ['math101', 'math102'], ['math102', 'math210'], ['math210', 'cs301'],
    ['cs101', 'cs102'], ['cs102', 'cs201'], ['cs140', 'cs201'],
    ['cs201', 'cs220'], ['cs201', 'cs240'], ['cs201', 'cs310'],
    ['cs240', 'cs301']
  ];

  const MINOR_COURSES = [
    { id: 'ai210', code: 'AI 210', name: 'Introduction to AI',            cr: 3, sem: 4, state: 'auto', lane: 'minor' },
    { id: 'ai310', code: 'AI 310', name: 'Machine Learning Fundamentals', cr: 3, sem: 5, state: 'auto', lane: 'minor' },
    { id: 'ai350', code: 'AI 350', name: 'AI Ethics',                     cr: 3, sem: 5, state: 'auto', lane: 'minor' }
  ];
  const MINOR_EDGES = [['cs201', 'ai210'], ['ai210', 'ai310'], ['ai210', 'ai350']];

  const MATH_COURSES = [
    { id: 'math101', code: 'MATH 101', name: 'Calculus I',            cr: 3, sem: 1, state: 'done' },
    { id: 'cs101',   code: 'CS 101',   name: 'Programming I',         cr: 3, sem: 1, state: 'done', tag: 'dropped' },
    { id: 'math102', code: 'MATH 102', name: 'Calculus II',           cr: 3, sem: 2, state: 'done' },
    { id: 'cs102',   code: 'CS 102',   name: 'Programming II',        cr: 3, sem: 2, state: 'done', tag: 'dropped' },
    { id: 'math210', code: 'MATH 210', name: 'Linear Algebra',        cr: 3, sem: 3, state: 'active' },
    { id: 'math205', code: 'MATH 205', name: 'Differential Equations',cr: 3, sem: 3, state: 'auto', tag: 'new' },
    { id: 'math220', code: 'MATH 220', name: 'Real Analysis I',       cr: 3, sem: 4, state: 'auto', tag: 'new' },
    { id: 'stat210', code: 'STAT 210', name: 'Probability Theory',    cr: 3, sem: 4, state: 'auto', tag: 'new' },
    { id: 'math301', code: 'MATH 301', name: 'Abstract Algebra',      cr: 3, sem: 5, state: 'auto', tag: 'new' },
    { id: 'math320', code: 'MATH 320', name: 'Numerical Methods',     cr: 3, sem: 5, state: 'auto', tag: 'new' }
  ];
  const MATH_EDGES = [
    ['math101', 'math102'], ['math102', 'math210'], ['math102', 'math205'],
    ['math210', 'math220'], ['math220', 'math301'], ['math210', 'stat210'],
    ['stat210', 'math320'], ['math205', 'math320']
  ];

  /* live state for the Current Path / Add a Minor scenarios */
  let courses = BASE_COURSES.map(c => ({ ...c }));
  let baseCredits = 42;
  const TOTAL_CREDITS = 120;
  let earnedThisSession = 0;

  /* =========================================================
     Derived state
     ========================================================= */
  function edgesFor(scenario) {
    if (scenario === 'minor') return BASE_EDGES.concat(MINOR_EDGES);
    if (scenario === 'major') return MATH_EDGES;
    return BASE_EDGES;
  }

  function prereqsOf(id, edges) { return edges.filter(e => e[1] === id).map(e => e[0]); }
  function unlockedBy(id, edges) { return edges.filter(e => e[0] === id).map(e => e[1]); }

  function resolveStates(list, edges) {
    const map = Object.fromEntries(list.map(c => [c.id, c]));
    list.forEach(c => {
      if (c.state === 'done' || c.state === 'active') { c.resolved = c.state; return; }
      const reqs = prereqsOf(c.id, edges).filter(r => map[r]);
      const ok = reqs.every(r => map[r].resolved === 'done' || map[r].state === 'done');
      c.resolved = ok ? 'open' : 'locked';
    });
    /* second pass so chains settle after a completion */
    list.forEach(c => {
      if (c.state === 'done' || c.state === 'active') return;
      const reqs = prereqsOf(c.id, edges).filter(r => map[r]);
      c.resolved = reqs.every(r => map[r].resolved === 'done') ? 'open' : 'locked';
    });
    return list;
  }

  function walk(id, edges, dir) {
    const found = new Set();
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      edges.forEach(([f, t]) => {
        const from = dir === 'up' ? t : f;
        const to = dir === 'up' ? f : t;
        if (from === cur && !found.has(to)) { found.add(to); stack.push(to); }
      });
    }
    return found;
  }

  const STATUS = {
    done:   { icon: '✓', label: 'COMPLETED' },
    active: { icon: '◉', label: 'IN PROGRESS' },
    open:   { icon: '○', label: 'AVAILABLE' },
    locked: { icon: '🔒', label: 'LOCKED' }
  };

  /* =========================================================
     Scenario configuration
     ========================================================= */
  const SCENARIOS = {
    current: {
      cta: 'Build My Path',
      fields: [
        { label: 'University', value: 'University of Sharjah', options: ['University of Sharjah', 'American University of Sharjah', 'RIT Dubai', 'Khalifa University'] },
        { label: 'Major', value: 'Computer Science', options: ['Computer Science', 'Computer Engineering', 'Mathematics', 'Information Systems'] },
        { label: 'Current Year', value: '2nd Year', options: ['1st Year', '2nd Year', '3rd Year', '4th Year'] }
      ]
    },
    major: {
      cta: 'Compare Paths',
      fields: [
        { label: 'University', value: 'University of Sharjah', options: ['University of Sharjah', 'American University of Sharjah', 'RIT Dubai'] },
        { label: 'Current Major', value: 'Computer Science', options: ['Computer Science', 'Computer Engineering', 'Information Systems'] },
        { label: 'Switch to', value: 'Mathematics', options: ['Mathematics', 'Statistics', 'Physics', 'Data Science'] },
        { label: 'Current Year', value: '2nd Year', options: ['1st Year', '2nd Year', '3rd Year'] }
      ]
    },
    minor: {
      cta: 'Add Minor',
      fields: [
        { label: 'University', value: 'University of Sharjah', options: ['University of Sharjah', 'American University of Sharjah', 'RIT Dubai'] },
        { label: 'Major', value: 'Computer Science', options: ['Computer Science', 'Computer Engineering', 'Information Systems'] },
        { label: 'Current Year', value: '2nd Year', options: ['1st Year', '2nd Year', '3rd Year'] },
        { label: 'Add Minor', value: 'Artificial Intelligence', options: ['Artificial Intelligence', 'Cybersecurity', 'Business Administration', 'Applied Mathematics'] }
      ]
    },
    university: {
      cta: 'Compare Universities',
      fields: [
        { label: 'Current University', value: 'University of Sharjah', options: ['University of Sharjah', 'American University of Sharjah'] },
        { label: 'Major', value: 'Computer Science', options: ['Computer Science', 'Computer Engineering', 'Information Systems'] },
        { label: 'Current Year', value: '2nd Year', options: ['1st Year', '2nd Year', '3rd Year'] },
        { label: 'Transfer to', value: 'RIT Dubai', options: ['RIT Dubai', 'Heriot-Watt Dubai', 'University of Birmingham Dubai'] }
      ]
    }
  };

  let scenario = 'current';

  /* =========================================================
     Custom dropdowns
     ========================================================= */
  function buildSelect(field) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.innerHTML = `
      <span class="field-label">${field.label}</span>
      <div class="select">
        <button type="button" class="select-btn" aria-haspopup="listbox" aria-expanded="false">
          <span class="select-value">${field.value}</span>
          <span class="select-chevron" aria-hidden="true"></span>
        </button>
        <ul class="select-menu" role="listbox" tabindex="-1"></ul>
      </div>`;

    const select = $('.select', wrap);
    const btn = $('.select-btn', wrap);
    const menu = $('.select-menu', wrap);
    const value = $('.select-value', wrap);

    field.options.forEach(opt => {
      const li = document.createElement('li');
      li.className = 'select-option';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(opt === field.value));
      li.textContent = opt;
      li.addEventListener('click', () => {
        value.textContent = opt;
        $$('.select-option', menu).forEach(o => o.setAttribute('aria-selected', String(o === li)));
        close();
        toast(`${field.label}: ${opt}`);
      });
      menu.appendChild(li);
    });

    const close = () => { select.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      $$('.select.is-open').forEach(s => { s.classList.remove('is-open'); $('.select-btn', s).setAttribute('aria-expanded', 'false'); });
      select.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    };

    btn.addEventListener('click', e => {
      e.stopPropagation();
      select.classList.contains('is-open') ? close() : open();
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(); $('.select-option', menu).focus?.(); }
      if (e.key === 'Escape') close();
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });

    return wrap;
  }

  function renderConfig(key) {
    const fieldsWrap = $('#configFields');
    const cta = $('#buildBtn');
    const conf = SCENARIOS[key];

    fieldsWrap.classList.add('is-swapping');
    setTimeout(() => {
      fieldsWrap.textContent = '';
      conf.fields.forEach(f => fieldsWrap.appendChild(buildSelect(f)));
      cta.innerHTML = `${conf.cta} <span class="arrow">→</span>`;
      fieldsWrap.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 240);
  }

  /* =========================================================
     Map rendering
     ========================================================= */
  const view = $('#view');

  function courseCard(c, i, editable) {
    const s = STATUS[c.resolved];
    const card = document.createElement('article');
    card.className = `course state-${c.resolved}`;
    if (c.tag === 'new') card.classList.add('is-new');
    if (c.tag === 'dropped') card.classList.add('is-dropped');
    card.dataset.id = c.id;
    card.style.setProperty('--d', i);

    const canCheck = c.resolved === 'active' || c.resolved === 'open';
    card.innerHTML = `
      <p class="c-status"><span class="c-icon">${s.icon}</span>${c.tag === 'dropped' ? 'NO LONGER REQUIRED' : s.label}</p>
      <p class="c-code">${c.code}</p>
      <p class="c-name">${c.name}</p>
      <p class="c-credits">${c.cr} credits</p>
      ${editable ? `<button class="c-check" type="button" ${canCheck ? '' : 'disabled'}
          aria-label="${canCheck ? 'Mark ' + c.name + ' complete' : c.name + ' is not available yet'}">✓</button>` : ''}`;

    if (c.resolved === 'locked') {
      const reqs = prereqsOf(c.id, edgesFor(scenario))
        .map(id => courses.find(x => x.id === id) || MINOR_COURSES.find(x => x.id === id))
        .filter(Boolean);
      if (reqs.length) {
        const pop = document.createElement('div');
        pop.className = 'req-pop';
        pop.innerHTML = '<b>Requires</b>' + reqs
          .map(r => `<span class="${r.resolved === 'done' ? 'met' : ''}">${r.resolved === 'done' ? '✓ ' : '· '}${r.name}</span>`)
          .join('');
        card.appendChild(pop);
      }
    }
    return card;
  }

  let renderList = [];

  function renderMap(list, edges, opts = {}) {
    resolveStates(list, edges);
    renderList = list;
    const sems = SEMESTERS.filter(s => list.some(c => c.sem === s.n));

    const wrap = document.createElement('div');
    wrap.className = 'map-wrap';
    wrap.innerHTML = `
      <div class="map-scroll">
        <div class="map">
          <div class="year-band"></div>
          <div class="map-grid">
            <svg class="edges-svg" aria-hidden="true">
              <defs>
                <linearGradient id="exGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#4DA3FF" />
                  <stop offset="100%" stop-color="#9B8CFF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>`;

    const band = $('.year-band', wrap);
    const grid = $('.map-grid', wrap);
    grid.style.gridTemplateColumns = `repeat(${sems.length}, minmax(180px, 1fr))`;
    band.style.gridTemplateColumns = grid.style.gridTemplateColumns;

    /* year tags spanning their semesters */
    const years = [...new Set(sems.map(s => s.year))];
    years.forEach(y => {
      const span = sems.filter(s => s.year === y).length;
      const tag = document.createElement('p');
      tag.className = 'year-tag';
      tag.style.gridColumn = `span ${span}`;
      tag.textContent = `Year ${y}`;
      band.appendChild(tag);
    });

    let index = 0;
    let branchLabelled = false;
    sems.forEach(s => {
      const col = document.createElement('div');
      col.className = 'col';
      col.dataset.sem = s.n;
      col.innerHTML = `<div class="col-head"><p class="col-sem">${s.label}</p><p class="col-term">${s.term}</p></div>`;
      const cards = document.createElement('div');
      cards.className = 'col-cards';
      cards.dataset.sem = s.n;

      list.filter(c => c.sem === s.n && c.lane !== 'minor')
        .forEach(c => cards.appendChild(courseCard(c, index++, opts.editable)));

      const minors = list.filter(c => c.sem === s.n && c.lane === 'minor');
      if (minors.length) {
        const band2 = document.createElement('div');
        band2.className = 'branch-band';
        if (!branchLabelled) {
          band2.innerHTML = '<p class="branch-label">AI minor branch</p>';
          branchLabelled = true;
        }
        minors.forEach(c => band2.appendChild(courseCard(c, index++, opts.editable)));
        cards.appendChild(band2);
      }

      col.appendChild(cards);
      grid.appendChild(col);
    });

    return wrap;
  }

  /* ---------- connections ---------- */
  function drawEdges(wrap, edges, animate) {
    const grid = $('.map-grid', wrap);
    const svg = $('.edges-svg', wrap);
    if (!grid || !svg) return;

    const gr = grid.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${gr.width} ${gr.height}`);
    svg.setAttribute('width', gr.width);
    svg.setAttribute('height', gr.height);

    $$('.ln', svg).forEach(n => n.remove());

    const rectOf = id => {
      const el = $(`.course[data-id="${id}"]`, wrap);
      if (!el || el.classList.contains('is-dragging')) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - gr.left, y: r.top - gr.top, w: r.width, h: r.height, el };
    };

    let i = 0;
    edges.forEach(([from, to]) => {
      const a = rectOf(from), b = rectOf(to);
      if (!a || !b) return;

      let d;
      if (b.x > a.x + a.w * 0.5) {
        const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
        const dx = Math.max((x2 - x1) * 0.5, 18);
        d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
      } else {
        const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y;
        const dy = Math.max((y2 - y1) * 0.5, 14);
        d = `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
      }

      const fc = renderList.find(c => c.id === from);
      const tc = renderList.find(c => c.id === to);
      let cls = 'ln';
      if (b.el.closest('.branch-band') || a.el.closest('.branch-band')) cls += ' s-minor';
      else if (fc && fc.resolved === 'done' && tc && tc.resolved !== 'locked') cls += ' s-done';
      else if ((fc && fc.resolved === 'active') || (tc && tc.resolved === 'active')) cls += ' s-active';

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', cls);
      path.setAttribute('d', d);
      path.dataset.from = from;
      path.dataset.to = to;
      svg.appendChild(path);

      if (animate && !reduceMotion) {
        const len = path.getTotalLength();
        path.style.setProperty('--len', len);
        path.style.setProperty('--d', i++);
        path.classList.add('draw');
      }
    });
  }

  /* ---------- hover highlighting ---------- */
  function wireHighlight(wrap, edges) {
    const cards = $$('.course', wrap);
    const clear = () => {
      cards.forEach(c => c.classList.remove('is-lit', 'is-dim'));
      $$('.ln', wrap).forEach(l => l.classList.remove('is-lit', 'is-dim'));
    };
    cards.forEach(card => {
      const id = card.dataset.id;
      card.addEventListener('mouseenter', () => {
        if (card.classList.contains('is-dragging')) return;
        const chain = new Set([id, ...walk(id, edges, 'up'), ...walk(id, edges, 'down')]);
        cards.forEach(c => {
          c.classList.toggle('is-lit', chain.has(c.dataset.id));
          c.classList.toggle('is-dim', !chain.has(c.dataset.id));
        });
        $$('.ln', wrap).forEach(l => {
          const inChain = chain.has(l.dataset.from) && chain.has(l.dataset.to);
          l.classList.toggle('is-lit', inChain);
          l.classList.toggle('is-dim', !inChain);
        });
        markCalloutDone(1);
      });
    });
    wrap.addEventListener('mouseleave', clear);
  }

  /* ---------- completing a course ---------- */
  function wireChecks(wrap, edges) {
    $$('.c-check', wrap).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = btn.closest('.course');
        const course = courses.find(c => c.id === card.dataset.id) || MINOR_COURSES.find(c => c.id === card.dataset.id);
        if (!course || btn.disabled) return;

        course.state = 'done';
        resolveStates(currentList(), edges);
        earnedThisSession += course.cr;
        updateProgress();

        card.classList.add('just-done');
        setTimeout(() => card.classList.remove('just-done'), 900);

        $$('.course', wrap).forEach(refreshCard);
        drawEdges(wrap, edges, false);
        toast(`${course.name} marked complete · +${course.cr} credits`);
        markCalloutDone(0);
      });
    });
  }

  function currentList() {
    return scenario === 'minor' ? courses.concat(MINOR_COURSES) : courses;
  }

  function refreshCard(card) {
    const course = currentList().find(c => c.id === card.dataset.id);
    if (!course) return;
    const s = STATUS[course.resolved];
    card.className = `course state-${course.resolved}`;
    if (course.tag === 'new') card.classList.add('is-new');
    if (course.tag === 'dropped') card.classList.add('is-dropped');
    $('.c-status', card).innerHTML = `<span class="c-icon">${s.icon}</span>${s.label}`;
    const btn = $('.c-check', card);
    if (btn) {
      const canCheck = course.resolved === 'active' || course.resolved === 'open';
      btn.disabled = !canCheck && course.resolved !== 'done';
      if (course.resolved === 'done') btn.disabled = true;
    }
    const pop = $('.req-pop', card);
    if (pop && course.resolved !== 'locked') pop.remove();
  }

  /* ---------- drag to another semester ---------- */
  function wireDrag(wrap, edges) {
    if (!finePointer) return;

    $$('.course', wrap).forEach(card => {
      card.addEventListener('pointerdown', start);

      function start(e) {
        if (e.target.closest('.c-check')) return;
        const course = currentList().find(c => c.id === card.dataset.id);
        if (!course || course.resolved === 'done') return;

        const startRect = card.getBoundingClientRect();
        const offX = e.clientX - startRect.left;
        const offY = e.clientY - startRect.top;
        let dragging = false;

        const ghost = document.createElement('div');
        ghost.className = 'drop-ghost';
        ghost.style.height = startRect.height + 'px';

        const cols = $$('.col-cards', wrap);
        const minSem = Math.max(0, ...prereqsOf(course.id, edges)
          .map(id => (currentList().find(c => c.id === id) || {}).sem || 0));
        const maxSem = Math.min(99, ...unlockedBy(course.id, edges)
          .map(id => (currentList().find(c => c.id === id) || {}).sem || 99));

        const move = ev => {
          if (!dragging) {
            if (Math.abs(ev.clientX - e.clientX) + Math.abs(ev.clientY - e.clientY) < 5) return;
            dragging = true;
            card.style.setProperty('--dw', startRect.width + 'px');
            card.after(ghost);
            card.classList.add('is-dragging');
            card.setPointerCapture(e.pointerId);
            cols.forEach(c => {
              const n = Number(c.dataset.sem);
              c.classList.add(n > minSem && n < maxSem ? 'is-drop' : 'is-drop-bad');
            });
          }
          card.style.left = (ev.clientX - offX) + 'px';
          card.style.top = (ev.clientY - offY) + 'px';
        };

        const end = ev => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', end);
          if (!dragging) return;

          card.classList.remove('is-dragging');
          card.style.left = card.style.top = '';
          cols.forEach(c => c.classList.remove('is-drop', 'is-drop-bad'));

          const target = cols.find(c => {
            const r = c.getBoundingClientRect();
            return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top - 30 && ev.clientY <= r.bottom + 30;
          });
          const n = target ? Number(target.dataset.sem) : null;

          if (target && n > minSem && n < maxSem && n !== course.sem) {
            const branch = $('.branch-band', target);
            branch ? target.insertBefore(card, branch) : target.appendChild(card);
            course.sem = n;
            ghost.remove();
            toast(`${course.name} moved to Semester ${n}`);
            markCalloutDone(2);
          } else {
            ghost.replaceWith(card);
            if (target && n !== course.sem) {
              card.classList.add('snap-back');
              setTimeout(() => card.classList.remove('snap-back'), 460);
              const blocker = n <= minSem
                ? prereqsOf(course.id, edges).map(id => (currentList().find(c => c.id === id) || {}).name).filter(Boolean)[0]
                : unlockedBy(course.id, edges).map(id => (currentList().find(c => c.id === id) || {}).name).filter(Boolean)[0];
              toast(blocker ? `Can't move there — ${blocker} is in the way` : `That semester doesn't work`);
            }
          }
          resolveStates(currentList(), edges);
          $$('.course', wrap).forEach(refreshCard);
          drawEdges(wrap, edges, false);
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
      }
    });
  }

  /* =========================================================
     Tutorial callouts
     ========================================================= */
  const CALLOUTS = [
    { n: 1, title: 'Mark courses complete', text: 'Click the check to update your progress.', anchor: '.course[data-id="cs201"]', side: 'top' },
    { n: 2, title: 'Follow your prerequisites', text: 'Hover a course to see what it needs and what it unlocks.', anchor: '.col[data-sem="2"]', side: 'bottom' },
    { n: 3, title: 'Rearrange your path', text: 'Drag a course to another semester and explore a different plan.', anchor: '.col[data-sem="4"]', side: 'bottom' },
    { n: 4, title: 'Locked by prerequisites', text: 'Hover to see which courses unlock it.', anchor: '.course[data-id="cs301"]', side: 'top' }
  ];
  let calloutEls = [];

  function renderCallouts(wrap) {
    calloutEls = [];
    if (window.innerWidth <= 1180) return;
    wrap.style.paddingTop = '128px';
    wrap.style.paddingBottom = '150px';

    CALLOUTS.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'callout';
      el.dataset.side = c.side;
      el.style.setProperty('--n', i);
      el.innerHTML = `<span class="co-num">${c.n}</span>
        <p class="co-title">${c.title}</p>
        <p class="co-text">${c.text}</p>`;
      wrap.appendChild(el);
      calloutEls.push({ el, cfg: c });
    });
    positionCallouts(wrap);
  }

  function positionCallouts(wrap) {
    const wr = wrap.getBoundingClientRect();
    calloutEls.forEach(({ el, cfg }) => {
      const anchor = $(cfg.anchor, wrap);
      if (!anchor) { el.style.display = 'none'; return; }
      const ar = anchor.getBoundingClientRect();
      const ax = ar.left - wr.left, ay = ar.top - wr.top;
      const w = el.offsetWidth, h = el.offsetHeight;
      let left = ax, top = ay;

      if (cfg.side === 'top')    { top = ay - h - 20; left = ax - 24; }
      if (cfg.side === 'bottom') { top = ay + ar.height + 20; left = ax - 24; }
      if (cfg.side === 'left')   { left = ax - w - 20; top = ay - 8; }
      if (cfg.side === 'right')  { left = ax + ar.width + 20; top = ay - 8; }

      el.style.left = Math.max(0, Math.min(left, wr.width - w)) + 'px';
      el.style.top = Math.max(0, top) + 'px';
    });
  }

  function markCalloutDone(i) {
    const item = calloutEls[i];
    if (item) item.el.classList.add('is-done');
  }

  function renderCoachList() {
    const list = $('#coachList');
    list.textContent = '';
    CALLOUTS.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${c.n}. ${c.title}</b><span>${c.text}</span>`;
      list.appendChild(li);
    });
  }

  /* =========================================================
     Progress
     ========================================================= */
  function updateProgress() {
    const total = baseCredits + earnedThisSession;
    $('#ppCredits').textContent = total;
    $('#ppBar').style.width = Math.min(100, (total / TOTAL_CREDITS) * 100) + '%';
    const pct = total / TOTAL_CREDITS;
    $('#ppStatus').textContent = pct >= 0.5 ? 'Year 2 · Ahead of plan' : 'Year 2 · On track';
  }

  /* =========================================================
     Scenario views
     ========================================================= */
  function chipRow(items) {
    const row = document.createElement('div');
    row.className = 'changes';
    row.innerHTML = '<span class="changes-label">What changes?</span>' + items
      .map((it, i) => `<span class="chip ${it.cls}" style="--d:${i}"><b>${it.n}</b>${it.label}</span>`)
      .join('');
    return row;
  }

  function viewHead(title, text) {
    const h = document.createElement('div');
    h.className = 'view-head';
    h.innerHTML = `<h2>${title}</h2><p>${text}</p>`;
    return h;
  }

  function buildCurrent(animate) {
    const edges = BASE_EDGES;
    const wrap = renderMap(courses, edges, { editable: true });
    view.appendChild(wrap);
    afterMap(wrap, edges, animate);
    renderCallouts(wrap);
    renderCoachList();
  }

  function buildMinor(animate) {
    const edges = edgesFor('minor');
    const list = courses.concat(MINOR_COURSES);
    view.appendChild(viewHead('Artificial Intelligence minor',
      'The minor branches off Data Structures and runs alongside your degree — three extra courses, same graduation date.'));
    view.appendChild(chipRow([
      { n: 3, label: 'courses added', cls: 'c-new' },
      { n: 9, label: 'extra credits', cls: 'c-keep' },
      { n: 0, label: 'semesters delayed', cls: 'c-keep' }
    ]));
    const wrap = renderMap(list, edges, { editable: true });
    view.appendChild(wrap);
    afterMap(wrap, edges, animate);
  }

  function buildMajor(animate) {
    const edges = MATH_EDGES;
    const list = MATH_COURSES.map(c => ({ ...c }));
    view.appendChild(viewHead('Computer Science → Mathematics',
      'Your calculus sequence carries over. Your programming track stops counting toward the degree, and five new requirements appear in years 2 and 3.'));
    view.appendChild(chipRow([
      { n: 3, label: 'courses remain relevant', cls: 'c-keep' },
      { n: 5, label: 'new requirements', cls: 'c-new' },
      { n: 2, label: 'semesters affected', cls: 'c-warn' }
    ]));
    const wrap = renderMap(list, edges, { editable: false });
    view.appendChild(wrap);
    drawEdges(wrap, edges, animate);
    wireHighlight(wrap, edges);
    observeResize(wrap, edges);
  }

  const EQUIV = [
    ['Calculus I', 'MATH-181 Project-Based Calculus I', 'ok', 'Transfers'],
    ['Programming I', 'SWEN-123 Software Development I', 'ok', 'Transfers'],
    ['Discrete Structures', 'MATH-190 Discrete Mathematics', 'part', 'Partial credit'],
    ['Physics I', 'General elective credit', 'part', 'Partial credit'],
    ['Data Structures', 'CSCI-243 The Mechanics of Programming', 'ok', 'Transfers'],
    ['—', 'ISTE-140 Web & Mobile I', 'new', 'New requirement'],
    ['—', 'MATH-241 Linear Algebra (RIT version)', 'new', 'New requirement']
  ];

  function buildUniversity(animate) {
    view.appendChild(viewHead('University of Sharjah → RIT Dubai',
      'Most of your foundation carries across. Two new requirements appear, and four credits land as electives instead of major credit.'));
    view.appendChild(chipRow([
      { n: 34, label: 'credits transfer', cls: 'c-keep' },
      { n: 8, label: 'credits as electives', cls: 'c-warn' },
      { n: 2, label: 'new requirements', cls: 'c-new' }
    ]));

    const compare = document.createElement('div');
    compare.className = 'compare';
    compare.innerHTML = `
      <div class="uni-col" style="--d:0">
        <p class="uni-name">University of Sharjah</p>
        <p class="uni-role">Your path today</p>
        <div class="uni-flow">
          <div class="uni-step">Computer Science, B.S.<small>2nd year · 12 courses mapped</small></div>
          <span class="uni-arrow"></span>
          <div class="uni-step">42 credits earned<small>of 120 required</small></div>
          <span class="uni-arrow"></span>
          <div class="uni-step">Graduating May 2028<small>4 semesters remaining</small></div>
        </div>
      </div>
      <div class="uni-col is-target" style="--d:1">
        <p class="uni-name">RIT Dubai</p>
        <p class="uni-role">If you transfer</p>
        <div class="uni-flow">
          <div class="uni-step">Transfer evaluation<small>Course-by-course review</small></div>
          <span class="uni-arrow"></span>
          <div class="uni-step">34 credits accepted<small>8 applied as electives</small></div>
          <span class="uni-arrow"></span>
          <div class="uni-step">Graduating Dec 2028<small>One extra semester</small></div>
        </div>
      </div>`;
    view.appendChild(compare);

    const equiv = document.createElement('div');
    equiv.className = 'equiv';
    EQUIV.forEach((row, i) => {
      const r = document.createElement('div');
      r.className = 'equiv-row';
      r.style.setProperty('--d', i);
      r.innerHTML = `<span>${row[0]}</span><span class="eq-tag ${row[2]}">${row[3]}</span><span class="eq-to">${row[1]}</span>`;
      equiv.appendChild(r);
    });
    view.appendChild(equiv);

    const note = document.createElement('p');
    note.className = 'disclaimer';
    note.textContent = 'Illustrative prototype data. Course equivalencies are examples, not actual RIT Dubai transfer decisions.';
    view.appendChild(note);
  }

  function afterMap(wrap, edges, animate) {
    drawEdges(wrap, edges, animate);
    wireHighlight(wrap, edges);
    wireChecks(wrap, edges);
    wireDrag(wrap, edges);
    observeResize(wrap, edges);
  }

  let resizeHandler = null;
  function observeResize(wrap, edges) {
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    let t;
    resizeHandler = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        drawEdges(wrap, edges, false);
        if (calloutEls.length) positionCallouts(wrap);
      }, 120);
    };
    window.addEventListener('resize', resizeHandler);
    const scroller = $('.map-scroll', wrap);
    if (scroller) scroller.addEventListener('scroll', () => { if (calloutEls.length) positionCallouts(wrap); }, { passive: true });
  }

  const BUILDERS = { current: buildCurrent, minor: buildMinor, major: buildMajor, university: buildUniversity };

  function renderScenario(key, animate = true) {
    scenario = key;
    calloutEls = [];
    $('#coachList').textContent = '';
    const swap = () => {
      view.textContent = '';
      view.classList.remove('is-leaving');
      view.classList.add('is-entering');
      BUILDERS[key](animate);
      setTimeout(() => {
        view.classList.remove('is-entering');
        const wrap = $('.map-wrap', view);
        if (wrap) drawEdges(wrap, edgesFor(key), false);
        if (wrap && calloutEls.length) positionCallouts(wrap);
      }, 650);
    };
    if (reduceMotion) { swap(); return; }
    view.classList.add('is-leaving');
    setTimeout(swap, 260);
  }

  /* =========================================================
     Tabs
     ========================================================= */
  const tabs = $('#tabs');
  const pill = $('#tabPill');
  const tabBtns = $$('.tab', tabs);

  function movePill(btn, instant) {
    const tr = tabs.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(tabs).borderLeftWidth) || 0;
    if (instant) pill.style.transition = 'none';
    pill.style.width = br.width + 'px';
    pill.style.transform = `translateX(${br.left - tr.left - border}px)`;
    if (instant) requestAnimationFrame(() => { pill.style.transition = ''; });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-selected') === 'true') return;
      tabBtns.forEach(b => b.setAttribute('aria-selected', String(b === btn)));
      movePill(btn);
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      renderConfig(btn.dataset.scenario);
      renderScenario(btn.dataset.scenario);
    });
    btn.addEventListener('keydown', e => {
      const i = tabBtns.indexOf(btn);
      const next = e.key === 'ArrowRight' ? tabBtns[i + 1] : e.key === 'ArrowLeft' ? tabBtns[i - 1] : null;
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  });

  /* =========================================================
     Misc: build button, toast, nav
     ========================================================= */
  $('#buildBtn').addEventListener('click', () => {
    renderScenario(scenario);
    toast(scenario === 'current' ? 'Pathway rebuilt' : 'Scenario updated');
  });

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('is-open', !open);
  });

  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
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

  /* =========================================================
     Boot
     ========================================================= */
  requestAnimationFrame(() => $('.ex-title').classList.add('is-in'));
  renderConfig('current');
  updateProgress();
  renderScenario('current');
  requestAnimationFrame(() => movePill(tabBtns[0], true));
  window.addEventListener('resize', () => movePill(tabBtns.find(b => b.getAttribute('aria-selected') === 'true'), true));
})();
