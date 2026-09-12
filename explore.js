/* ============================================================
   DegreeFlow — /explore
   One degree map, four ways to change it.

   Everything on this page reads from a single `state` object and
   a single course catalogue. Switching a major, adding a minor or
   moving university all rebuild the SAME map, so the four tabs are
   views onto one academic journey rather than four mini-apps.

   Course data is illustrative prototype data, not a real catalogue.
   ============================================================ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* =========================================================
     1. CATALOGUE
     ========================================================= */

  /* UNIVERSITY LOGOS — fill these in to show a logo, e.g.
     sharjah: 'logos/sharjah.svg'. Leave null for an empty slot. */
  const LOGO_SRC = {
    sharjah: 'logos/uos logo.png',
    khalifa: 'logos/ku logo.png',
    aus: 'logos/aus logo.png',
    rit: 'logos/rit logo.png'
  };

  const UNIVERSITIES = {
    sharjah: { id: 'sharjah', name: 'University of Sharjah', home: true },
    khalifa: {
      id: 'khalifa', name: 'Khalifa University',
      adds: [['ku200', 5], ['ku310', 6], ['ku320', 7]],
      review: ['phys101', 'eng101', 'cs140'],
      note: 'Khalifa runs a common core through years 1 and 2 and a heavier research sequence in year 4.'
    },
    aus: {
      id: 'aus', name: 'American University of Sharjah',
      adds: [['aus210', 5], ['aus320', 7]],
      review: ['eng101', 'phys101'],
      note: 'AUS requires its own writing sequence and a general-education cluster.'
    },
    rit: {
      id: 'rit', name: 'RIT Dubai',
      adds: [['rit100', 5], ['rit220', 6], ['rit310', 7]],
      review: ['math150', 'cs140', 'phys101'],
      note: 'RIT runs on a different credit structure, so several courses map only partially.'
    }
  };

  const MAJORS = {
    cs:    { id: 'cs',    name: 'Computer Science', degree: 'BSc Computer Science' },
    math:  { id: 'math',  name: 'Mathematics',      degree: 'BSc Mathematics' },
    stats: { id: 'stats', name: 'Statistics',       degree: 'BSc Statistics' }
  };

  /* shared course registry — an id means the same course everywhere,
     which is what makes transfer between majors computable */
  const DB = {
    math101: ['MATH 101', 'Calculus I', 3],
    math102: ['MATH 102', 'Calculus II', 3],
    math150: ['MATH 150', 'Foundations of Mathematics', 3],
    math205: ['MATH 205', 'Differential Equations', 3],
    math210: ['MATH 210', 'Linear Algebra', 3],
    math220: ['MATH 220', 'Real Analysis I', 3],
    math230: ['MATH 230', 'Number Theory', 3],
    math301: ['MATH 301', 'Abstract Algebra', 3],
    math310: ['MATH 310', 'Complex Analysis', 3],
    math320: ['MATH 320', 'Numerical Methods', 3],
    math330: ['MATH 330', 'Partial Differential Equations', 3],
    math401: ['MATH 401', 'Senior Project I', 3],
    math402: ['MATH 402', 'Senior Project II', 3],
    math410: ['MATH 410', 'Mathematical Modelling', 3],
    math420: ['MATH 420', 'Optimization', 3],
    stat210: ['STAT 210', 'Probability Theory', 3],
    stat220: ['STAT 220', 'Statistical Inference', 3],
    stat310: ['STAT 310', 'Regression Analysis', 3],
    stat320: ['STAT 320', 'Time Series Analysis', 3],
    stat330: ['STAT 330', 'Experimental Design', 3],
    stat401: ['STAT 401', 'Statistical Computing', 3],
    cs101: ['CS 101', 'Programming I', 3],
    cs102: ['CS 102', 'Programming II', 3],
    cs140: ['CS 140', 'Discrete Structures', 3],
    cs201: ['CS 201', 'Data Structures', 3],
    cs220: ['CS 220', 'Database Management', 3],
    cs230: ['CS 230', 'Computer Architecture', 3],
    cs240: ['CS 240', 'Algorithms', 3],
    cs301: ['CS 301', 'Artificial Intelligence', 3],
    cs310: ['CS 310', 'Operating Systems', 3],
    cs320: ['CS 320', 'Software Engineering', 3],
    cs330: ['CS 330', 'Computer Networks', 3],
    cs340: ['CS 340', 'Machine Learning', 3],
    cs401: ['CS 401', 'Capstone I', 3],
    cs402: ['CS 402', 'Capstone II', 3],
    cs410: ['CS 410', 'Information Security', 3],
    phys101: ['PHYS 101', 'Physics I', 4],
    phys102: ['PHYS 102', 'Physics II', 4],
    eng101: ['ENG 101', 'Academic Writing', 3],
    elecA: ['ELEC 300', 'Technical Elective', 3],
    elecB: ['ELEC 350', 'Technical Elective', 3],
    elecC: ['ELEC 400', 'Free Elective', 3],
    ai210: ['AI 210', 'Introduction to AI', 3],
    ai240: ['AI 240', 'Machine Learning Fundamentals', 3],
    ai310: ['AI 310', 'Deep Learning', 3],
    ai330: ['AI 330', 'AI Ethics & Society', 3],
    ai340: ['AI 340', 'Computer Vision', 3],
    ai350: ['AI 350', 'AI Minor Project', 3],
    ds210: ['DS 210', 'Data Wrangling', 3],
    ds240: ['DS 240', 'Statistical Learning', 3],
    ds310: ['DS 310', 'Data Visualization', 3],
    ds330: ['DS 330', 'Big Data Systems', 3],
    ds340: ['DS 340', 'Predictive Modelling', 3],
    ds350: ['DS 350', 'Data Science Project', 3],
    ku200: ['CORE 200', 'Innovation & Entrepreneurship', 3],
    ku310: ['CORE 310', 'Research Methods', 3],
    ku320: ['CORE 320', 'Professional Ethics', 3],
    aus210: ['WRI 210', 'Advanced Academic Writing', 3],
    aus320: ['GEN 320', 'General Education Cluster', 3],
    rit100: ['YOP 010', 'First-Year Seminar', 1],
    rit220: ['ISTE 140', 'Web & Mobile I', 3],
    rit310: ['MATH 241', 'Linear Algebra (RIT)', 3]
  };

  /* prerequisites are global: an edge is drawn whenever both
     courses exist in the plan being displayed */
  const PREREQ = {
    math102: ['math101'], math150: ['math101'], math205: ['math102'], math210: ['math102'],
    math220: ['math210'], math230: ['math150'], math301: ['math220'], math310: ['math220'],
    math320: ['math205', 'math210'], math330: ['math205'], math401: ['math301'],
    math402: ['math401'], math410: ['math320'], math420: ['math210'],
    stat210: ['math102'], stat220: ['stat210'], stat310: ['stat220', 'math210'],
    stat320: ['stat310'], stat330: ['stat220'], stat401: ['stat310'],
    cs102: ['cs101'], cs140: ['cs101'], cs201: ['cs102', 'cs140'], cs220: ['cs201'],
    cs230: ['cs102'], cs240: ['cs201'], cs301: ['cs240', 'math210'], cs310: ['cs230', 'cs201'],
    cs320: ['cs201'], cs330: ['cs310'], cs340: ['cs301', 'stat210'], cs401: ['cs320'],
    cs402: ['cs401'], cs410: ['cs330'], phys102: ['phys101'],
    ai210: ['cs201', 'math210'], ai240: ['ai210'], ai310: ['ai240'], ai330: ['ai210'],
    ai340: ['ai240'], ai350: ['ai310', 'ai330'],
    ds210: ['stat210', 'math102'], ds240: ['ds210'], ds310: ['ds240'], ds330: ['ds210'],
    ds340: ['ds240'], ds350: ['ds310'],
    ku310: ['ku200'], rit220: ['rit100']
  };

  /* plans: [courseId, semester, kind?] */
  const PLANS = {
    cs: [
      ['math101', 1], ['cs101', 1], ['phys101', 1], ['eng101', 1],
      ['math102', 2], ['cs102', 2], ['cs140', 2],
      ['cs201', 3], ['math210', 3], ['stat210', 3],
      ['cs220', 4], ['cs240', 4], ['cs230', 4],
      ['cs301', 5], ['cs310', 5], ['cs320', 5],
      ['cs330', 6], ['cs340', 6], ['elecA', 6, 'elective'],
      ['cs401', 7], ['cs410', 7], ['elecB', 7, 'elective'],
      ['cs402', 8], ['elecC', 8, 'elective']
    ],
    math: [
      ['math101', 1], ['cs101', 1], ['phys101', 1], ['eng101', 1],
      ['math102', 2], ['math150', 2], ['phys102', 2],
      ['math210', 3], ['math205', 3], ['stat210', 3],
      ['math220', 4], ['math230', 4], ['stat220', 4],
      ['math301', 5], ['math310', 5], ['math320', 5],
      ['math330', 6], ['math420', 6], ['elecA', 6, 'elective'],
      ['math401', 7], ['math410', 7], ['elecB', 7, 'elective'],
      ['math402', 8], ['elecC', 8, 'elective']
    ],
    stats: [
      ['math101', 1], ['cs101', 1], ['phys101', 1], ['eng101', 1],
      ['math102', 2], ['math150', 2], ['cs102', 2],
      ['stat210', 3], ['math210', 3], ['math205', 3],
      ['stat220', 4], ['stat330', 4], ['math220', 4],
      ['stat310', 5], ['stat401', 5], ['math320', 5],
      ['stat320', 6], ['ds210', 6], ['elecA', 6, 'elective'],
      ['math401', 7], ['math410', 7], ['elecB', 7, 'elective'],
      ['math402', 8], ['elecC', 8, 'elective']
    ]
  };

  const MINORS = {
    ai: { id: 'ai', name: 'Artificial Intelligence', courses: [['ai210', 5], ['ai240', 5], ['ai310', 6], ['ai330', 6], ['ai340', 7], ['ai350', 7]] },
    ds: { id: 'ds', name: 'Data Science', courses: [['ds210', 5], ['ds240', 5], ['ds310', 6], ['ds330', 6], ['ds340', 7], ['ds350', 7]] }
  };

  const SEM_META = [
    null,
    { year: 1, name: 'Semester 1', term: 'Fall' },
    { year: 1, name: 'Semester 2', term: 'Spring' },
    { year: 2, name: 'Semester 3', term: 'Fall' },
    { year: 2, name: 'Semester 4', term: 'Spring' },
    { year: 3, name: 'Semester 5', term: 'Fall' },
    { year: 3, name: 'Semester 6', term: 'Spring' },
    { year: 4, name: 'Semester 7', term: 'Fall' },
    { year: 4, name: 'Semester 8', term: 'Spring' }
  ];

  const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  /* =========================================================
     2. STATE — every view reads from this
     ========================================================= */
  const state = {
    tab: 'current',
    university: 'sharjah',
    major: 'cs',
    year: '3rd Year',
    minor: null,
    targetMajor: 'math',
    targetMinor: 'ai',
    targetUniversity: 'khalifa',
    preview: null,          // 'major' | 'minor' | 'university'
    selected: null,
    completed: new Set(),   // manually ticked
    moved: {},              // courseId -> semester (drag persistence)
    lastChange: null        // summary for the What changed panel
  };

  const currentSem = () => (YEAR_OPTIONS.indexOf(state.year) * 2) + 1;
  const majorName = id => MAJORS[id].name;
  const uniName = id => UNIVERSITIES[id].name;

  /* =========================================================
     3. PATH BUILDING
     ========================================================= */
  function buildPath(o = {}) {
    const major = o.major || state.major;
    const minor = 'minor' in o ? o.minor : state.minor;
    const university = o.university || state.university;
    const sem0 = currentSem();

    const rows = PLANS[major].map(([id, sem, kind]) => ({ id, sem, kind: kind || 'core' }));
    if (minor && MINORS[minor]) {
      MINORS[minor].courses.forEach(([id, sem]) => rows.push({ id, sem, kind: 'minor' }));
    }
    const uni = UNIVERSITIES[university];
    if (uni.adds) uni.adds.forEach(([id, sem]) => rows.push({ id, sem, kind: 'core' }));

    const list = rows.map(r => {
      const [code, name, cr] = DB[r.id];
      return { id: r.id, code, name, cr, sem: state.moved[r.id] || r.sem, kind: r.kind };
    });

    /* history is done, the current semester is active,
       everything later is open or locked by prerequisites */
    list.forEach(c => {
      if (state.completed.has(c.id) || c.sem < sem0) c.state = 'done';
      else if (c.sem === sem0) c.state = 'active';
      else c.state = null;
    });
    resolve(list);
    return list;
  }

  function edgesOf(list) {
    const ids = new Set(list.map(c => c.id));
    const out = [];
    list.forEach(c => (PREREQ[c.id] || []).forEach(p => { if (ids.has(p)) out.push([p, c.id]); }));
    return out;
  }

  function resolve(list) {
    const map = Object.fromEntries(list.map(c => [c.id, c]));
    for (let pass = 0; pass < 2; pass++) {
      list.forEach(c => {
        if (c.state === 'done' || c.state === 'active') return;
        const reqs = (PREREQ[c.id] || []).filter(r => map[r]);
        c.state = reqs.every(r => map[r].state === 'done') ? 'open' : 'locked';
      });
    }
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

  const credits = list => list.reduce((n, c) => n + c.cr, 0);
  /* the map shows major requirements; a full degree also carries
     university and general-education credit, so progress is measured
     against the programme requirement */
  const DEGREE_CREDITS = 120;
  const MINOR_CREDITS = 18;
  const requirement = () => DEGREE_CREDITS + (state.minor ? MINOR_CREDITS : 0);
  const doneCredits = list => list.filter(c => c.state === 'done').reduce((n, c) => n + c.cr, 0);

  function diff(before, after) {
    const b = new Map(before.map(c => [c.id, c]));
    const a = new Map(after.map(c => [c.id, c]));
    const kept = [...a.keys()].filter(id => b.has(id));
    return {
      kept,
      added: [...a.values()].filter(c => !b.has(c.id)),
      removed: [...b.values()].filter(c => !a.has(c.id)),
      before: credits(before),
      after: credits(after),
      get changed() { return this.added.length + this.removed.length; }
    };
  }

  /* =========================================================
     4. SMALL HELPERS
     ========================================================= */
  function logoSlot(uniId, size) {
    const src = LOGO_SRC[uniId];
    /* UNIVERSITY LOGO — ADD IMAGE HERE (or set LOGO_SRC at the top of this file) */
    return `<span class="uni-logo ${size || ''}" data-uni="${uniId}">${
      src ? `<img src="${src}" alt="${uniName(uniId)} logo">` : '<!-- UNIVERSITY LOGO — ADD IMAGE HERE -->'
    }</span>`;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  /* =========================================================
     5. CONFIGURATION PANEL
     ========================================================= */
  function fieldsFor(tab) {
    const uniOpts = Object.keys(UNIVERSITIES).map(id => ({ value: id, label: uniName(id) }));
    const majorOpts = Object.keys(MAJORS).map(id => ({ value: id, label: MAJORS[id].name }));
    const minorOpts = Object.keys(MINORS).map(id => ({ value: id, label: MINORS[id].name }));
    const yearOpts = YEAR_OPTIONS.map(y => ({ value: y, label: y }));

    const uni = { key: 'university', label: 'University', value: state.university, options: uniOpts, logos: true };
    const major = { key: 'major', label: 'Major', value: state.major, options: majorOpts };
    const year = { key: 'year', label: 'Current Year', value: state.year, options: yearOpts };

    if (tab === 'major') return [uni, { ...major, label: 'Current Major' },
      { key: 'targetMajor', label: 'Switch to', value: state.targetMajor, options: majorOpts }, year];
    if (tab === 'minor') return [uni, major,
      { key: 'targetMinor', label: 'Add Minor', value: state.targetMinor, options: minorOpts }, year];
    if (tab === 'university') return [{ ...uni, label: 'Current University' }, major, year,
      { key: 'targetUniversity', label: 'Transfer to', value: state.targetUniversity, options: uniOpts, logos: true }];
    return [uni, major, year];
  }

  function buildSelect(field) {
    const wrap = el('div', 'field');
    const current = field.options.find(o => o.value === field.value) || field.options[0];
    wrap.innerHTML = `
      <span class="field-label">${field.label}</span>
      <div class="select">
        <button type="button" class="select-btn" aria-haspopup="listbox" aria-expanded="false">
          ${field.logos ? logoSlot(current.value) : ''}
          <span class="select-value">${current.label}</span>
          <span class="select-chevron" aria-hidden="true"></span>
        </button>
        <ul class="select-menu" role="listbox"></ul>
      </div>`;

    const select = $('.select', wrap);
    const btn = $('.select-btn', wrap);
    const menu = $('.select-menu', wrap);
    const close = () => { select.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };

    field.options.forEach(opt => {
      const li = el('li', 'select-option');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(opt.value === field.value));
      li.innerHTML = `${field.logos ? logoSlot(opt.value) : ''}<span>${opt.label}</span>`;
      li.addEventListener('click', () => {
        close();
        if (opt.value === state[field.key]) return;
        onFieldChange(field.key, opt.value);
      });
      menu.appendChild(li);
    });

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = select.classList.contains('is-open');
      $$('.select.is-open').forEach(s => { s.classList.remove('is-open'); $('.select-btn', s).setAttribute('aria-expanded', 'false'); });
      if (!open) { select.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
    btn.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
    return wrap;
  }

  function onFieldChange(key, value) {
    if (key === 'major' && value !== state.major) {
      /* progress that no longer applies is cleared with the major */
      state.completed.clear();
      state.moved = {};
      state.selected = null;
    }
    if (key === 'university' && value !== state.university) state.selected = null;

    state[key] = value;
    state.preview = null;

    renderConfig();
    renderState();
    render();

    const label = { university: 'University', major: 'Major', year: 'Year',
      targetMajor: 'Target major', targetMinor: 'Minor', targetUniversity: 'Transfer target' }[key];
    const pretty = key === 'year' ? value : (MAJORS[value] || MINORS[value] || UNIVERSITIES[value]).name;
    toast(`${label}: ${pretty}`);
  }

  function renderConfig() {
    const wrap = $('#configFields');
    const cta = $('#buildBtn');
    const fields = fieldsFor(state.tab);
    const ctaLabel = { current: 'Build My Path', major: 'Preview New Path',
      minor: 'Preview Minor', university: 'Compare Universities' }[state.tab];

    wrap.classList.add('is-swapping');
    setTimeout(() => {
      wrap.textContent = '';
      fields.forEach(f => wrap.appendChild(buildSelect(f)));
      cta.innerHTML = `${ctaLabel} <span class="arrow">→</span>`;
      wrap.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 220);

    const modified = !!(state.minor || state.university !== 'sharjah' ||
      state.major !== 'cs' || state.completed.size || Object.keys(state.moved).length);
    $('#resetBtn').hidden = !modified;
    $('#configBar').classList.toggle('is-on', modified);
  }

  function renderState() {
    const bits = [`<b>${uniName(state.university)}</b>`, '<span class="sep"></span>',
      `<b>${MAJORS[state.major].degree}</b>`, '<span class="sep"></span>', state.year];
    if (state.minor) bits.push(`<span class="mod">${MINORS[state.minor].name} minor</span>`);
    if (state.university !== 'sharjah') bits.push('<span class="mod">Transferred</span>');
    $('#exState').innerHTML = bits.join(' ');
  }

  /* =========================================================
     6. TIMELINE MAP
     ========================================================= */
  const STATUS = {
    done:   { icon: '✓', label: 'COMPLETED' },
    active: { icon: '◉', label: 'IN PROGRESS' },
    open:   { icon: '○', label: 'AVAILABLE' },
    locked: { icon: '🔒', label: 'LOCKED' }
  };

  /* which minor a course belongs to, so the branch can label itself */
  function minorOf(id) {
    const found = Object.values(MINORS).find(m => m.courses.some(([cid]) => cid === id));
    return found ? found.name : null;
  }

  function courseCard(c, i, opts) {
    const card = el('article', `course st-${c.state} kind-${c.kind}`);
    card.dataset.id = c.id;
    card.style.setProperty('--d', i);
    if (opts.animate) card.classList.add('anim-in');
    if (c.diff) card.classList.add('diff-' + c.diff);

    const movable = opts.editable && c.state !== 'done';
    if (!movable) card.classList.add('no-drag');

    const s = STATUS[c.state];
    const label = c.diff === 'new' ? 'NEW REQUIREMENT' : s.label;
    const canCheck = opts.editable && (c.state === 'active' || c.state === 'open');

    card.innerHTML = `
      <p class="c-status"><span class="c-icon">${s.icon}</span>${label}</p>
      <p class="c-code">${c.code}</p>
      <p class="c-name">${c.name}</p>
      <p class="c-cr">${c.cr} credits${c.kind === 'elective' ? ' · elective' : ''}</p>
      ${opts.editable ? `<button class="c-check" type="button" ${canCheck ? '' : 'disabled'}
          aria-label="${canCheck ? 'Mark ' + c.name + ' complete' : c.name + ' cannot be completed yet'}">✓</button>` : ''}`;

    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${c.code} ${c.name}, ${label.toLowerCase()}`);
    return card;
  }

  function buildTimeline(list, opts = {}) {
    const tl = el('div', 'timeline');
    tl.innerHTML = `<svg class="edges-svg" aria-hidden="true"><defs>
        <linearGradient id="exGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4DA3FF"/><stop offset="100%" stop-color="#9B8CFF"/>
        </linearGradient></defs></svg>`;

    const sem0 = currentSem();
    let i = 0;
    [1, 2, 3, 4].forEach(year => {
      const sems = [year * 2 - 1, year * 2];
      const yearCourses = list.filter(c => sems.includes(c.sem));
      if (!yearCourses.length) return;

      const row = el('div', 'year-row');
      row.dataset.year = year;
      if (sems.includes(sem0)) row.classList.add('is-now');
      row.innerHTML = `<div class="year-rail">
          <span class="year-num">Year ${year}</span>
          <span class="year-line"></span>
          <span class="year-cr">${credits(yearCourses)} cr</span>
        </div>`;

      const cols = el('div', 'sem-cols');
      sems.forEach(sem => {
        const meta = SEM_META[sem];
        const col = el('div', 'sem-col');
        col.innerHTML = `<div class="sem-head"><span class="sem-name">${meta.name}</span><span class="sem-term">${meta.term}</span></div>`;
        const cards = el('div', 'sem-cards');
        cards.dataset.sem = sem;
        list.filter(c => c.sem === sem && c.kind !== 'minor')
          .forEach(c => cards.appendChild(courseCard(c, i++, opts)));

        const minors = list.filter(c => c.sem === sem && c.kind === 'minor');
        if (minors.length) {
          const group = el('div', 'minor-group');
          group.appendChild(el('p', 'minor-group-label', `${minorOf(minors[0].id) || 'Minor'} minor`));
          minors.forEach(c => group.appendChild(courseCard(c, i++, opts)));
          cards.appendChild(group);
        }
        col.appendChild(cards);
        cols.appendChild(col);
      });
      row.appendChild(cols);
      tl.appendChild(row);
    });
    return tl;
  }

  function drawEdges(tl, edges, list, animate) {
    const svg = $('.edges-svg', tl);
    if (!svg) return;
    const gr = tl.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${gr.width} ${gr.height}`);
    $$('.ln', svg).forEach(n => n.remove());

    const byId = Object.fromEntries(list.map(c => [c.id, c]));
    const rectOf = id => {
      const node = $(`.course[data-id="${id}"]`, tl);
      if (!node || node.classList.contains('is-dragging')) return null;
      const r = node.getBoundingClientRect();
      return { x: r.left - gr.left, y: r.top - gr.top, w: r.width, h: r.height };
    };

    let i = 0;
    edges.forEach(([from, to]) => {
      const a = rectOf(from), b = rectOf(to);
      if (!a || !b) return;

      let d;
      if (b.y > a.y + a.h - 6) {
        const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y;
        const dy = Math.max((y2 - y1) * 0.45, 16);
        d = `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
      } else {
        const right = b.x > a.x;
        const x1 = right ? a.x + a.w : a.x, y1 = a.y + a.h / 2;
        const x2 = right ? b.x : b.x + b.w, y2 = b.y + b.h / 2;
        const dx = Math.max(Math.abs(x2 - x1) * 0.5, 18) * (right ? 1 : -1);
        d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
      }

      const fc = byId[from], tc = byId[to];
      let cls = 'ln';
      if (fc.kind === 'minor' || tc.kind === 'minor') cls += ' s-minor';
      else if (fc.state === 'done' && tc.state !== 'locked') cls += ' s-done';
      else if (fc.state === 'active' || tc.state === 'active') cls += ' s-active';

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', cls);
      path.setAttribute('d', d);
      path.dataset.from = from;
      path.dataset.to = to;
      svg.appendChild(path);

      if (animate && !reduceMotion && typeof path.getTotalLength === 'function') {
        try {
          const len = path.getTotalLength();
          path.style.setProperty('--len', len);
          path.style.setProperty('--d', i++);
          path.classList.add('draw');
        } catch (err) { /* geometry unavailable — line still renders */ }
      }
    });
  }

  /* =========================================================
     7. THE LIVE MAP
     ========================================================= */
  const map = { root: null, tl: null, list: [], edges: [], opts: {} };

  function mountMap(container, list, opts) {
    map.root = container;
    map.list = list;
    map.edges = edgesOf(list);
    map.opts = opts;
    const tl = buildTimeline(list, { animate: true, editable: opts.editable });
    container.textContent = '';
    container.appendChild(tl);
    map.tl = tl;
    wireCards();
    requestAnimationFrame(() => drawEdges(tl, map.edges, list, true));
    setTimeout(() => { drawEdges(tl, map.edges, list, false); positionTutorial(); }, 900);
  }

  /* re-render with FLIP so surviving courses glide to their new home */
  function morphMap(list) {
    if (!map.root) return;
    const before = new Map();
    $$('.course', map.tl).forEach(n => before.set(n.dataset.id, n.getBoundingClientRect()));
    const gone = $$('.course', map.tl).filter(n => !list.some(c => c.id === n.dataset.id));
    gone.forEach(n => n.classList.add('is-removing'));

    const commit = () => {
      map.list = list;
      map.edges = edgesOf(list);
      const tl = buildTimeline(list, { animate: false, editable: map.opts.editable });
      map.root.textContent = '';
      map.root.appendChild(tl);
      map.tl = tl;
      wireCards();

      $$('.course', tl).forEach(node => {
        const old = before.get(node.dataset.id);
        if (!old) { node.classList.add('diff-new'); return; }
        if (reduceMotion) return;
        const now = node.getBoundingClientRect();
        const dx = old.left - now.left, dy = old.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        node.style.transition = 'none';
        node.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          node.style.transition = 'transform .7s cubic-bezier(.19,1,.22,1)';
          node.style.transform = '';
          setTimeout(() => { node.style.transition = ''; }, 760);
        });
      });

      requestAnimationFrame(() => drawEdges(tl, map.edges, list, false));
      setTimeout(() => { drawEdges(tl, map.edges, list, false); positionTutorial(); }, 780);
      renderRail();
    };

    if (gone.length && !reduceMotion) setTimeout(commit, 340);
    else commit();
  }

  function clearHighlight() {
    $$('.course', map.tl).forEach(n => n.classList.remove('is-lit', 'is-dim'));
    $$('.ln', map.tl).forEach(l => l.classList.remove('is-lit', 'is-dim'));
  }

  function highlight(id) {
    const chain = new Set([id, ...walk(id, map.edges, 'up'), ...walk(id, map.edges, 'down')]);
    $$('.course', map.tl).forEach(n => {
      n.classList.toggle('is-lit', chain.has(n.dataset.id) && n.dataset.id !== id);
      n.classList.toggle('is-dim', !chain.has(n.dataset.id));
    });
    $$('.ln', map.tl).forEach(l => {
      const inChain = chain.has(l.dataset.from) && chain.has(l.dataset.to);
      l.classList.toggle('is-lit', inChain);
      l.classList.toggle('is-dim', !inChain);
    });
  }

  function selectCourse(id) {
    if (!map.list.some(c => c.id === id)) return;
    state.selected = id;
    $$('.course', map.tl).forEach(n => n.classList.toggle('is-selected', n.dataset.id === id));
    highlight(id);
    renderRail();
    tutorialDone('select');
  }

  function wireCards() {
    $$('.course', map.tl).forEach(card => {
      const id = card.dataset.id;
      if (state.selected === id) card.classList.add('is-selected');
      card.addEventListener('mouseenter', () => { if (!dragging) highlight(id); });
      card.addEventListener('mouseleave', () => {
        if (dragging) return;
        state.selected ? highlight(state.selected) : clearHighlight();
      });
      card.addEventListener('click', () => selectCourse(id));
      const check = $('.c-check', card);
      if (check) check.addEventListener('click', e => {
        e.stopPropagation();
        if (!check.disabled) completeCourse(id);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCourse(id); }
      });
      if (map.opts.editable && finePointer && !card.classList.contains('no-drag')) wireDrag(card);
    });
    if (state.selected && map.list.some(c => c.id === state.selected)) highlight(state.selected);
  }

  function completeCourse(id) {
    const course = map.list.find(c => c.id === id);
    if (!course || course.state === 'done' || course.state === 'locked') return;

    state.completed.add(id);
    morphMap(buildPath());

    const card = $(`.course[data-id="${id}"]`, map.tl);
    if (card) {
      card.classList.add('flash-done');
      setTimeout(() => card.classList.remove('flash-done'), 900);
    }
    renderConfig();

    const unlocked = map.edges.filter(e => e[0] === id)
      .map(e => map.list.find(c => c.id === e[1]))
      .filter(c => c && c.state === 'open').length;
    toast(unlocked ? `${course.name} complete · ${unlocked} course${unlocked > 1 ? 's' : ''} unlocked`
      : `${course.name} complete`);
    tutorialDone('complete');
  }

  /* ---------- drag between semesters ---------- */
  let dragging = false;
  function wireDrag(card) {
    card.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const id = card.dataset.id;
      const course = map.list.find(c => c.id === id);
      if (!course) return;

      const startRect = card.getBoundingClientRect();
      const offX = e.clientX - startRect.left, offY = e.clientY - startRect.top;
      const sem0 = currentSem();
      let started = false, ghost = null, cols = [];

      /* a course may sit anywhere after its prerequisites and
         before anything that depends on it */
      const prereqSems = (PREREQ[id] || [])
        .map(p => (map.list.find(c => c.id === p) || {}).sem)
        .filter(Boolean);
      const dependentSems = map.edges.filter(x => x[0] === id)
        .map(x => (map.list.find(c => c.id === x[1]) || {}).sem)
        .filter(Boolean);
      const minSem = Math.max(sem0, ...prereqSems.map(s => s + 1));
      const maxSem = dependentSems.length ? Math.min(...dependentSems) - 1 : 8;

      const move = ev => {
        if (!started) {
          if (Math.abs(ev.clientX - e.clientX) + Math.abs(ev.clientY - e.clientY) < 5) return;
          started = dragging = true;
          ghost = el('div', 'drop-ghost');
          ghost.style.height = startRect.height + 'px';
          card.style.setProperty('--dw', startRect.width + 'px');
          card.after(ghost);
          card.classList.add('is-dragging');
          clearHighlight();
          cols = $$('.sem-cards', map.tl);
          cols.forEach(c => {
            const n = Number(c.dataset.sem);
            c.classList.add(n >= minSem && n <= maxSem ? 'is-drop' : 'is-drop-bad');
          });
        }
        card.style.left = (ev.clientX - offX) + 'px';
        card.style.top = (ev.clientY - offY) + 'px';
      };

      const end = ev => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        if (!started) return;
        dragging = false;
        card.classList.remove('is-dragging');
        card.style.left = card.style.top = '';
        cols.forEach(c => c.classList.remove('is-drop', 'is-drop-bad'));

        const target = cols.find(c => {
          const r = c.getBoundingClientRect();
          return ev.clientX >= r.left && ev.clientX <= r.right &&
                 ev.clientY >= r.top - 26 && ev.clientY <= r.bottom + 26;
        });
        const n = target ? Number(target.dataset.sem) : null;
        ghost.replaceWith(card);

        if (target && n !== course.sem && n >= minSem && n <= maxSem) {
          state.moved[id] = n;
          morphMap(buildPath());
          renderConfig();
          toast(`${course.name} moved to ${SEM_META[n].name}`);
          tutorialDone('drag');
          return;
        }

        if (target && n !== course.sem) {
          card.classList.add('snap-back');
          setTimeout(() => card.classList.remove('snap-back'), 460);
          const blockerId = n < minSem ? (PREREQ[id] || [])[0]
            : (map.edges.find(x => x[0] === id) || [])[1];
          const blocker = (map.list.find(c => c.id === blockerId) || {}).name;
          toast(n < sem0 ? 'That semester is already behind you'
            : blocker ? `Can't move there — ${blocker} is in the way`
            : 'That semester does not work');
        }
        drawEdges(map.tl, map.edges, map.list, false);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
    });
  }

  /* =========================================================
     8. RAIL: progress, course detail, what changed
     ========================================================= */
  let railEl = null;

  function renderRail() {
    if (!railEl) return;
    railEl.textContent = '';
    if (state.lastChange) railEl.appendChild(changedPanel());
    railEl.appendChild(progressPanel());
    railEl.appendChild(detailPanel());
  }

  function progressPanel() {
    const total = requirement();
    const done = doneCredits(map.list);
    const pct = Math.round((done / total) * 100);
    const yearIdx = YEAR_OPTIONS.indexOf(state.year) + 1;
    const expected = (yearIdx - 1) / 4;
    return el('div', 'panel-card', `
      <p class="panel-label">YOUR PROGRESS</p>
      <p class="pp-figure"><strong>${done}</strong><span>/ ${total} credits</span></p>
      <div class="pp-bar"><i style="width:${pct}%"></i></div>
      <p class="pp-foot"><span class="pp-dot"></span>${state.year} · ${
        done / total >= expected - 0.06 ? 'On track' : 'Behind plan'}</p>`);
  }

  function detailPanel() {
    const p = el('div', 'panel-card detail');
    const c = map.list.find(x => x.id === state.selected);
    if (!c) {
      p.innerHTML = `<p class="panel-label">COURSE DETAIL</p>
        <p class="detail-empty">Select any course on the map to see what it depends on and what it unlocks.</p>`;
      return p;
    }

    const reqs = (PREREQ[c.id] || []).map(id => map.list.find(x => x.id === id)).filter(Boolean);
    const unlocks = map.edges.filter(e => e[0] === c.id).map(e => map.list.find(x => x.id === e[1])).filter(Boolean);
    const label = { done: 'Completed', active: 'In progress', open: 'Available now', locked: 'Locked' }[c.state];

    p.innerHTML = `
      <p class="panel-label">COURSE DETAIL</p>
      <p class="detail-code">${c.code}</p>
      <p class="detail-name">${c.name}</p>
      <div class="detail-meta">
        <span class="meta-chip st-${c.state}">${label}</span>
        <span class="meta-chip">${c.cr} credits</span>
        <span class="meta-chip">${SEM_META[c.sem].name}</span>
        ${c.kind !== 'core' ? `<span class="meta-chip">${c.kind === 'minor' ? 'Minor' : 'Elective'}</span>` : ''}
      </div>
      ${reqs.length ? `<div class="detail-block"><h4>PREREQUISITES</h4>
        <ul class="detail-list">${reqs.map(r =>
          `<li data-go="${r.id}" class="${r.state === 'done' ? 'met' : ''}"><i>${r.state === 'done' ? '✓' : '·'}</i>${r.name}</li>`).join('')}</ul></div>` : ''}
      ${unlocks.length ? `<div class="detail-block"><h4>UNLOCKS</h4>
        <ul class="detail-list">${unlocks.map(u => `<li data-go="${u.id}"><i>→</i>${u.name}</li>`).join('')}</ul>
        <span class="unlock-count">${unlocks.length} course${unlocks.length > 1 ? 's' : ''} unlocked</span></div>` : ''}
      ${(c.state === 'active' || c.state === 'open') && map.opts.editable
        ? '<p class="detail-empty" style="margin-top:13px">Use the check on the course card to mark it complete.</p>' : ''}`;

    $$('[data-go]', p).forEach(li => li.addEventListener('click', () => selectCourse(li.dataset.go)));
    return p;
  }

  function changedPanel() {
    const d = state.lastChange;
    const p = el('div', 'panel-card changed', `
      <p class="panel-label">YOUR PATH CHANGED</p>
      <div class="changed-rows">
        <p class="changed-row add"><b>+${d.added}</b> new courses</p>
        <p class="changed-row rem"><b>−${d.removed}</b> removed courses</p>
        <p class="changed-row same"><b>${d.kept}</b> courses carried over</p>
      </div>
      <div class="changed-foot">
        <span>Credits: <strong>${d.before} → ${d.after}</strong></span>
        <span>Graduation: <strong>${d.grad}</strong></span>
      </div>
      <button class="btn btn-ghost btn-sm changed-close" type="button">Dismiss</button>`);
    $('.changed-close', p).addEventListener('click', () => { state.lastChange = null; renderRail(); });
    return p;
  }

  /* =========================================================
     9. VIEWS
     ========================================================= */
  const view = $('#view');

  function mapLayout(title, sub, editable, list) {
    const layout = el('div', 'map-layout');
    const left = el('div', '');
    const head = el('div', 'section-title', `<div><h2>${title}</h2><p>${sub}</p></div>`);
    if (editable) {
      const tip = el('button', 'tip-btn', 'Show tips');
      tip.type = 'button';
      tip.addEventListener('click', () => startTutorial(true));
      head.appendChild(tip);
    }
    left.appendChild(head);
    const holder = el('div', 'map-holder');
    left.appendChild(holder);
    railEl = el('aside', 'rail');
    layout.append(left, railEl);
    view.appendChild(layout);
    mountMap(holder, list, { editable });
    renderRail();
  }

  function viewCurrent() {
    const minorBit = state.minor ? ` + ${MINORS[state.minor].name} minor` : '';
    mapLayout(
      `${MAJORS[state.major].degree}${minorBit}`,
      `${uniName(state.university)} · ${state.year}. Hover to trace prerequisites, click a course for detail, drag an upcoming course to replan it.`,
      true, buildPath()
    );
    startTutorial();
  }

  function miniPath(list, tagOf) {
    const box = el('div', 'mini-list');
    [1, 2, 3, 4].forEach(y => {
      const rows = list.filter(c => SEM_META[c.sem].year === y);
      if (!rows.length) return;
      box.appendChild(el('p', 'mini-year', `YEAR ${y}`));
      rows.forEach(c => {
        const k = tagOf(c);
        box.appendChild(el('div', `mini-row k-${k.cls}`,
          `<span class="mc">${c.code}</span><span class="mn">${c.name}</span><span class="mk">${k.mark}</span>`));
      });
    });
    return box;
  }

  function impactBars(rows) {
    const wrap = el('div', 'impact');
    const max = Math.max(...rows.map(r => r.value), 1);
    rows.forEach(r => {
      const row = el('div', 'impact-row',
        `<span>${r.label}</span>
         <span class="impact-track"><i class="impact-fill ${r.cls}"></i></span>
         <span class="impact-val">${r.value} credits</span>`);
      wrap.appendChild(row);
      requestAnimationFrame(() => { $('.impact-fill', row).style.width = (r.value / max * 100) + '%'; });
    });
    return wrap;
  }

  function compareBox(nodes) {
    const box = el('div', 'compare-box');
    nodes.filter(Boolean).forEach(n => box.appendChild(n));
    return box;
  }

  function actionRow(previewLabel, applyLabel, onPreview, onApply, note) {
    const row = el('div', 'action-row');
    const pv = el('button', 'btn btn-ghost magnetic', `${previewLabel} <span class="arrow">→</span>`);
    const ap = el('button', 'btn btn-primary magnetic', `${applyLabel} <span class="arrow">→</span>`);
    pv.type = ap.type = 'button';
    if (!state.preview) { ap.disabled = true; ap.style.opacity = '.45'; }
    pv.addEventListener('click', onPreview);
    ap.addEventListener('click', () => { if (state.preview) onApply(); });
    row.append(pv, ap);
    if (note) row.appendChild(el('span', 'action-note', note));
    return row;
  }

  /* previewing morphs the map that is already on screen — that is the
     moment the whole page exists for, so nothing else is torn down */
  function enterPreview(type, list, title, sub, msg) {
    state.preview = type;
    morphMap(list);
    const head = $('.map-layout .section-title');
    if (head) {
      $('h2', head).textContent = title;
      $('p', head).textContent = sub;
    }
    const apply = $('.action-row .btn-primary');
    if (apply) { apply.disabled = false; apply.style.opacity = '1'; }
    toast(msg);
  }

  function tagDiff(next, current) {
    const before = new Set(current.map(c => c.id));
    return next.map(c => ({ ...c, diff: before.has(c.id) ? 'keep' : 'new' }));
  }

  /* ---------- switch major ---------- */
  function viewMajor() {
    const from = state.major, to = state.targetMajor;
    const current = buildPath();
    const next = buildPath({ major: to });
    const d = diff(current, next);
    const keptSet = new Set(d.kept);

    view.appendChild(el('div', 'section-title',
      `<div><h2>${majorName(from)} → ${majorName(to)}</h2>
        <p>Two possible futures for the same student. Everything you have already passed is checked against the ${MAJORS[to].degree} requirements.</p></div>`));

    if (from === to) {
      view.appendChild(el('p', 'action-note', 'Pick a different target major to see the comparison.'));
      return;
    }

    const futures = el('div', 'futures');
    const a = el('div', 'future', `<div class="future-head"><div>
        <p class="future-role">CURRENT PATH</p>
        <p class="future-name">${majorName(from)}</p>
        <p class="future-sub">${credits(current)} credits · ${current.length} courses</p></div></div>`);
    a.appendChild(miniPath(current, c => keptSet.has(c.id) ? { cls: 'keep', mark: '✓' } : { cls: 'drop', mark: '!' }));

    const b = el('div', 'future is-new', `<div class="future-head"><div>
        <p class="future-role">NEW PATH</p>
        <p class="future-name">${majorName(to)}</p>
        <p class="future-sub">${credits(next)} credits · ${next.length} courses</p></div></div>`);
    b.appendChild(miniPath(next, c => keptSet.has(c.id) ? { cls: 'keep', mark: '✓' } : { cls: 'new', mark: '+' }));

    futures.append(a, b);
    view.appendChild(futures);

    const keptCr = d.kept.reduce((n, id) => n + next.find(c => c.id === id).cr, 0);
    const newCr = d.added.reduce((n, c) => n + c.cr, 0);

    view.appendChild(compareBox([
      el('div', 'legend',
        `<span><i style="color:#4DA3FF">✓</i> transfers to the new path</span>
         <span><i style="color:#5EE6A8">+</i> new requirement</span>
         <span><i style="color:#FF8FC0">!</i> no longer required</span>`),
      impactBars([
        { label: 'Already completed', value: doneCredits(current), cls: 'f-done' },
        { label: 'Transfers across', value: keptCr, cls: 'f-keep' },
        { label: 'New requirements', value: newCr, cls: 'f-new' }
      ]),
      el('div', 'stat-row', `
        <div class="stat s-warn"><b>${d.changed} courses</b><span>Your path changes by</span></div>
        <div class="stat s-new"><b>${d.after - d.before >= 0 ? '+' : ''}${d.after - d.before}</b><span>Credit difference</span></div>
        <div class="stat s-keep"><b>4 years</b><span>Graduation timeline</span></div>`),
      actionRow('Preview New Path', 'Apply to My Path',
      () => enterPreview('major', tagDiff(buildPath({ major: to }), current),
        `Preview · ${MAJORS[to].degree}`,
        'New requirements glow in; courses you keep slide to their new position.',
        `Previewing ${majorName(to)}`),
      () => applyChange('major'),
      'Prototype data — course equivalencies are illustrative.')
    ]));

    mapLayout(
      state.preview === 'major' ? `Preview · ${MAJORS[to].degree}` : MAJORS[from].degree,
      state.preview === 'major'
        ? 'New requirements glow in; courses you keep slide to their new position.'
        : 'Your path today. Press Preview New Path to watch it rebuild.',
      false, state.preview === 'major' ? tagDiff(next, current) : current);
  }

  /* ---------- add a minor ---------- */
  function viewMinor() {
    const minorId = state.targetMinor;
    const minor = MINORS[minorId];
    const current = buildPath({ minor: null });
    const next = buildPath({ minor: minorId });
    const d = diff(current, next);
    const overlap = minor.courses.filter(([id]) =>
      (PREREQ[id] || []).some(p => current.some(c => c.id === p))).length;
    const anchor = current.find(c => (PREREQ[minor.courses[0][0]] || []).includes(c.id));

    view.appendChild(el('div', 'section-title',
      `<div><h2>${MAJORS[state.major].degree} + ${minor.name} minor</h2>
        <p>A minor does not replace your degree — it branches off it. These ${minor.courses.length} courses hang from work you are already doing.</p></div>`));

    const grid = el('div', 'futures');
    const branch = el('div', 'future is-new', `<div class="future-head"><div>
        <p class="future-role">BRANCH PREVIEW</p>
        <p class="future-name">${minor.name} minor</p>
        <p class="future-sub">Branches from ${anchor ? anchor.name : 'your core path'}</p></div></div>`);
    branch.appendChild(miniPath(next.filter(c => c.kind === 'minor'), () => ({ cls: 'new', mark: '+' })));

    const impact = el('div', 'future', `<div class="future-head"><div>
        <p class="future-role">HOW IT CONNECTS</p>
        <p class="future-name">One branch, same degree</p>
        <p class="future-sub">Minor courses sit in a marked branch inside each semester, so they never blur into your core requirements.</p></div></div>`);
    grid.append(branch, impact);
    view.appendChild(grid);

    view.appendChild(compareBox([
      el('div', 'stat-row', `
        <div class="stat s-new"><b>+${d.after - d.before}</b><span>Additional credits</span></div>
        <div class="stat s-keep"><b>${minor.courses.length}</b><span>Courses</span></div>
        <div class="stat s-keep"><b>+${overlap}</b><span>Prerequisite overlap</span></div>
        <div class="stat s-new"><b>+0</b><span>Extra semesters</span></div>`),
      impactBars([
        { label: 'Major requirements', value: credits(current), cls: 'f-keep' },
        { label: 'Minor adds', value: d.after - d.before, cls: 'f-new' }
      ]),
      actionRow('Preview Minor', 'Add to My Path',
      () => enterPreview('minor', tagDiff(buildPath({ minor: minorId }), current),
        `Preview · with ${minor.name} minor`,
        'Minor courses join the map as a dashed branch off your core sequence.',
        `Previewing the ${minor.name} minor`),
      () => applyChange('minor'),
      state.minor === minorId ? 'This minor is already on your path.' : '')
    ]));

    mapLayout(
      state.preview === 'minor' ? `Preview · with ${minor.name} minor` : MAJORS[state.major].degree,
      state.preview === 'minor'
        ? 'Minor courses join the map as a dashed branch off your core sequence.'
        : 'Your path today. Press Preview Minor to see the branch appear.',
      false, state.preview === 'minor' ? tagDiff(next, current) : buildPath());
  }

  /* ---------- change university ---------- */
  function viewUniversity() {
    const fromId = state.university, toId = state.targetUniversity;
    const from = UNIVERSITIES[fromId], to = UNIVERSITIES[toId];
    const current = buildPath();
    const next = buildPath({ university: toId });
    const d = diff(current, next);

    view.appendChild(el('div', 'section-title',
      `<div><h2>${from.name} → ${to.name}</h2>
        <p>Moving university changes the structure around your degree, not just the courses inside it. Here is what would carry across.</p></div>`));

    if (fromId === toId) {
      view.appendChild(el('p', 'action-note', 'Pick a different university to compare.'));
      return;
    }

    const reviewIds = new Set(to.review || []);
    const done = current.filter(c => c.state === 'done');
    const reviewCr = done.filter(c => reviewIds.has(c.id)).reduce((n, c) => n + c.cr, 0);
    const transferCr = doneCredits(current) - reviewCr;
    const newCr = d.added.reduce((n, c) => n + c.cr, 0);

    const futures = el('div', 'futures');
    const a = el('div', 'future', `<div class="future-head">${logoSlot(fromId, 'lg')}<div>
        <p class="future-role">CURRENT</p>
        <p class="future-name">${from.name}</p>
        <p class="future-sub">${MAJORS[state.major].degree} · ${credits(current)} credits</p></div></div>`);
    a.appendChild(miniPath(done, c => reviewIds.has(c.id) ? { cls: 'change', mark: '↔' } : { cls: 'keep', mark: '✓' }));

    const b = el('div', 'future is-new', `<div class="future-head">${logoSlot(toId, 'lg')}<div>
        <p class="future-role">IF YOU TRANSFER</p>
        <p class="future-name">${to.name}</p>
        <p class="future-sub">${MAJORS[state.major].degree} · ${credits(next)} credits</p></div></div>`);
    b.appendChild(d.added.length
      ? miniPath(d.added, () => ({ cls: 'new', mark: '+' }))
      : el('p', 'detail-empty', 'No additional requirements for this programme.'));
    futures.append(a, b);
    view.appendChild(futures);

    view.appendChild(compareBox([
      el('div', 'legend',
        `<span><i style="color:#4DA3FF">✓</i> transfers as credit</span>
         <span><i style="color:#9B8CFF">↔</i> may need equivalency review</span>
         <span><i style="color:#5EE6A8">+</i> new requirement</span>`),
      impactBars([
        { label: 'Transferable', value: transferCr, cls: 'f-keep' },
        { label: 'May need review', value: reviewCr, cls: 'f-done' },
        { label: 'New requirements', value: newCr, cls: 'f-new' }
      ]),
      el('div', 'stat-row', `
        <div class="stat s-keep"><b>${doneCredits(current)}</b><span>Credits completed</span></div>
        <div class="stat s-keep"><b>${transferCr}</b><span>Transferable</span></div>
        <div class="stat s-warn"><b>${reviewCr}</b><span>May need review</span></div>
        <div class="stat s-new"><b>${newCr}</b><span>New requirements</span></div>`),
      el('div', 'notice',
        `<span>⚠</span><span><b>University requirements differ.</b> ${to.note} Some courses may require equivalency review before credit is granted.</span>`),
      actionRow('Compare Universities', 'Apply to My Path',
      () => enterPreview('university', tagDiff(buildPath({ university: toId }), current),
        `Preview · ${to.name}`,
        'Courses that transfer keep their place; new requirements appear in the later years.',
        `Previewing ${to.name}`),
      () => applyChange('university'), ''),
      el('p', 'disclaimer',
        'Illustrative prototype. Transfer outcomes here are examples for demonstration, not real admissions or credit decisions.')
    ]));

    mapLayout(
      state.preview === 'university' ? `Preview · ${to.name}` : from.name,
      state.preview === 'university'
        ? 'Courses that transfer keep their place; new requirements appear in the later years.'
        : 'Your path today. Press Compare Universities to rebuild it elsewhere.',
      false, state.preview === 'university' ? tagDiff(next, current) : current);
  }

  /* ---------- applying a change ---------- */
  function applyChange(kind) {
    const before = buildPath();
    if (kind === 'major') {
      state.major = state.targetMajor;
      state.completed.clear();
      state.moved = {};
    }
    if (kind === 'minor') state.minor = state.targetMinor;
    if (kind === 'university') state.university = state.targetUniversity;

    const after = buildPath();
    const d = diff(before, after);
    state.lastChange = {
      added: d.added.length, removed: d.removed.length, kept: d.kept.length,
      before: d.before, after: d.after, grad: 'Still on track · 4 years'
    };
    state.preview = null;
    state.selected = null;

    setTab('current');
    toast(kind === 'minor' ? `${MINORS[state.minor].name} minor added to your path`
      : kind === 'major' ? `Now on the ${MAJORS[state.major].degree}`
      : `Transferred to ${uniName(state.university)}`);
  }

  function resetPath() {
    state.major = 'cs';
    state.university = 'sharjah';
    state.minor = null;
    state.completed.clear();
    state.moved = {};
    state.selected = null;
    state.lastChange = null;
    state.preview = null;
    renderConfig();
    renderState();
    render();
    toast('Path reset to your starting degree');
  }

  /* =========================================================
     10. TUTORIAL — one bubble at a time, self-dismissing
     ========================================================= */
  const STEPS = [
    { id: 'select', title: 'Click a course', text: 'See what it depends on and everything it unlocks.', target: () => $('.course.st-active'), side: 'right' },
    { id: 'complete', title: 'Mark it complete', text: 'Finish a course and watch the next ones unlock.', target: () => $('.course.st-active .c-check'), side: 'right' },
    { id: 'drag', title: 'Move a course', text: 'Drag any upcoming course into a different semester.', target: () => $('.course.st-open'), side: 'right' },
    { id: 'scenario', title: 'Change something bigger', text: 'Switch a major, add a minor or move university — this map responds.', target: () => $('#tabs'), side: 'right' }
  ];
  let tutIndex = -1, tutEl = null, tutLayer = null;

  function ensureLayer() {
    if (tutLayer && document.body.contains(tutLayer)) return tutLayer;
    tutLayer = el('div', 'tut-layer');
    tutLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:30';
    const main = $('main');
    main.style.position = 'relative';
    main.appendChild(tutLayer);
    return tutLayer;
  }

  const seen = {
    get: () => { try { return sessionStorage.getItem('df-tut'); } catch (e) { return null; } },
    set: v => { try { sessionStorage.setItem('df-tut', v); } catch (e) {} },
    clear: () => { try { sessionStorage.removeItem('df-tut'); } catch (e) {} }
  };

  function startTutorial(force) {
    if (window.innerWidth <= 1040) return;
    if (!force && seen.get() === 'done') return;
    if (force) seen.clear();
    tutIndex = -1;
    setTimeout(() => nextStep(), 400);
  }

  function nextStep() {
    hideStep(() => {
      tutIndex += 1;
      if (tutIndex >= STEPS.length) { seen.set('done'); return; }
      const step = STEPS[tutIndex];
      if (!step.target()) { nextStep(); return; }

      tutEl = el('div', 'tutorial', `
        <button class="tut-close" type="button" aria-label="Dismiss tip">×</button>
        <p class="tut-step">STEP ${tutIndex + 1} OF ${STEPS.length}</p>
        <p class="tut-title">${step.title}</p>
        <p class="tut-text">${step.text}</p>
        <div class="tut-dots">${STEPS.map((_, i) => `<i class="${i <= tutIndex ? 'on' : ''}"></i>`).join('')}</div>`);
      tutEl.dataset.side = step.side;
      tutEl.style.pointerEvents = 'auto';
      $('.tut-close', tutEl).addEventListener('click', () => nextStep());
      ensureLayer().appendChild(tutEl);
      positionTutorial();
      requestAnimationFrame(() => tutEl.classList.add('is-on'));
    });
  }

  function hideStep(done) {
    if (!tutEl) { done && done(); return; }
    const old = tutEl;
    tutEl = null;
    old.classList.add('is-out');
    setTimeout(() => { old.remove(); done && done(); }, reduceMotion ? 0 : 340);
  }

  function tutorialDone(id) {
    if (tutEl && STEPS[tutIndex] && STEPS[tutIndex].id === id) setTimeout(nextStep, 500);
  }

  function positionTutorial() {
    if (!tutEl || !tutLayer) return;
    const step = STEPS[tutIndex];
    const target = step && step.target();
    if (!target) return;
    const lr = tutLayer.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const w = tutEl.offsetWidth, h = tutEl.offsetHeight;
    let left, top;

    if (step.side === 'right') { left = tr.right - lr.left + 18; top = tr.top - lr.top - 6; }
    else if (step.side === 'left') { left = tr.left - lr.left - w - 18; top = tr.top - lr.top - 6; }
    else if (step.side === 'bottom') { left = tr.left - lr.left; top = tr.bottom - lr.top + 16; }
    else { left = tr.left - lr.left; top = tr.top - lr.top - h - 16; }

    tutEl.style.left = Math.max(8, Math.min(left, lr.width - w - 8)) + 'px';
    tutEl.style.top = Math.max(0, top) + 'px';
  }

  /* =========================================================
     11. TABS + BOOT
     ========================================================= */
  const VIEWS = { current: viewCurrent, major: viewMajor, minor: viewMinor, university: viewUniversity };

  function render() {
    const build = () => {
      view.textContent = '';
      railEl = null;
      view.classList.remove('is-leaving');
      view.classList.add('is-entering');
      VIEWS[state.tab]();
      magnetize();
      setTimeout(() => view.classList.remove('is-entering'), 620);
    };
    if (reduceMotion) { build(); return; }
    view.classList.add('is-leaving');
    setTimeout(build, 220);
  }

  const tabs = $('#tabs');
  const pill = $('#tabPill');
  const tabBtns = $$('.tab', tabs);

  function movePill(btn, instant) {
    if (!btn) return;
    const tr = tabs.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(tabs).borderLeftWidth) || 0;
    if (instant) pill.style.transition = 'none';
    pill.style.width = br.width + 'px';
    pill.style.transform = `translateX(${br.left - tr.left - border}px)`;
    if (instant) requestAnimationFrame(() => { pill.style.transition = ''; });
  }

  function setTab(key) {
    state.tab = key;
    if (state.preview && state.preview !== key) state.preview = null;
    tabBtns.forEach(b => b.setAttribute('aria-selected', String(b.dataset.scenario === key)));
    movePill(tabBtns.find(b => b.dataset.scenario === key));
    view.setAttribute('aria-labelledby', 'tab-' + key);
    renderConfig();
    renderState();
    render();
    if (key !== 'current') tutorialDone('scenario');
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-selected') === 'true') return;
      setTab(btn.dataset.scenario);
      if (btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
    btn.addEventListener('keydown', e => {
      const i = tabBtns.indexOf(btn);
      const next = e.key === 'ArrowRight' ? tabBtns[i + 1] : e.key === 'ArrowLeft' ? tabBtns[i - 1] : null;
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  });

  $('#buildBtn').addEventListener('click', () => {
    if (state.tab === 'current') { render(); toast('Pathway rebuilt'); return; }
    const pv = $('.action-row .btn-ghost');
    if (pv) pv.click();
  });
  $('#resetBtn').addEventListener('click', resetPath);

  /* nav + ambient, matching the homepage */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  $('#navToggle').addEventListener('click', () => {
    const t = $('#navToggle');
    const open = t.getAttribute('aria-expanded') === 'true';
    t.setAttribute('aria-expanded', String(!open));
    $('#navLinks').classList.toggle('is-open', !open);
  });

  function magnetize() {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic').forEach(btn => {
      if (btn.dataset.mag) return;
      btn.dataset.mag = '1';
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

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      movePill(tabBtns.find(b => b.getAttribute('aria-selected') === 'true'), true);
      if (map.tl) drawEdges(map.tl, map.edges, map.list, false);
      positionTutorial();
    }, 140);
  });

  renderConfig();
  renderState();
  render();
  magnetize();
  requestAnimationFrame(() => movePill(tabBtns[0], true));
})();
