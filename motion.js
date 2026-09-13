/* ============================================================
   DegreeFlow — GSAP motion layer
   Preloader timeline, pinned scroll presentations (problem cards,
   confusion→clarity feature stack), scroll progress indicator,
   and small hover/tilt polish. Loads after app.js; degrades to the
   static layout if GSAP/ScrollTrigger are unavailable.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = (typeof window.__dfReduceMotion === 'boolean')
    ? window.__dfReduceMotion
    : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PIN_BREAKPOINT = 860; // keep in sync with home.css

  function releasePreloaderInstantly() {
    var pre = document.getElementById('preloader');
    if (pre) pre.remove();
    document.documentElement.classList.remove('is-loading');
    if (window.__dfStartIntro) window.__dfStartIntro();
  }

  /* If GSAP or ScrollTrigger failed to load (CDN blocked, offline, etc.)
     the page must still work: reveal it plainly and skip all the
     scroll-driven enhancements below. */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    releasePreloaderInstantly();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  runPreloader();
  initProgressIndicator();
  initProblemPresentation();
  initClarityPresentation();
  initCardTilt();

  /* ---------------------------------------------------------
     1. Preloader — orbiting geometry around the wordmark
     --------------------------------------------------------- */
  function runPreloader() {
    var pre = document.getElementById('preloader');
    if (!pre) { releasePreloaderInstantly(); return; }

    if (reduceMotion) { releasePreloaderInstantly(); return; }

    var numEl = document.getElementById('preCount');
    var barEl = document.getElementById('preBar');
    var rings = pre.querySelectorAll('.pre-ring');
    var nodes = pre.querySelectorAll('.pre-node');
    var word = pre.querySelector('.pre-word');
    var tag = pre.querySelector('.pre-tag');
    var orbits = ['#preOrbit1', '#preOrbit2', '#preOrbit3']
      .map(function (s) { return pre.querySelector(s); })
      .filter(Boolean);

    var spins = [];
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      pre.remove();
      document.documentElement.classList.remove('is-loading');
      if (window.__dfStartIntro) window.__dfStartIntro();
      ScrollTrigger.refresh();
    }

    gsap.set(rings, { opacity: 0 });
    gsap.set(nodes, { opacity: 0 });
    gsap.set(word, { opacity: 0 });
    gsap.set(tag, { opacity: 0 });

    var tl = gsap.timeline();
    tl.to(rings, { opacity: 1, scale: 1, duration: .7, stagger: .07, ease: 'power2.out' }, 0)
      .from(rings, { scale: .7, duration: .7, stagger: .07, ease: 'power2.out' }, 0)
      .to(nodes, { opacity: 1, duration: .5, stagger: .08, ease: 'back.out(2.2)' }, .25)
      .from(nodes, { scale: 0, duration: .5, stagger: .08, ease: 'back.out(2.2)' }, .25)
      .to(word, { opacity: 1, duration: .6, ease: 'power3.out' }, .35)
      .from(word, { y: 16, duration: .6, ease: 'power3.out' }, .35)
      .to(tag, { opacity: 1, duration: .5, ease: 'power3.out' }, .5)
      .from(tag, { y: 10, duration: .5, ease: 'power3.out' }, .5);

    orbits.forEach(function (orbit, i) {
      var dur = [8, 13, 20][i] || 16;
      var dir = i === 1 ? -360 : 360;
      spins.push(gsap.to(orbit, { rotation: dir, duration: dur, repeat: -1, ease: 'none' }));
    });

    var value = 0;
    function bump() {
      value = Math.min(value + Math.random() * 18 + 10, 100);
      if (numEl) numEl.textContent = Math.floor(value);
      if (barEl) barEl.style.width = value + '%';
      if (value < 100) {
        setTimeout(bump, 45 + Math.random() * 70);
      } else {
        setTimeout(exit, 180);
      }
    }
    setTimeout(bump, 260);

    function exit() {
      spins.forEach(function (s) { s.kill(); });
      gsap.timeline({ onComplete: finish })
        .to(nodes, { scale: 1.8, opacity: 0, duration: .5, stagger: .04, ease: 'power2.in' }, 0)
        .to(rings, { opacity: 0, scale: 1.12, duration: .45, ease: 'power1.in' }, 0)
        .to([word, tag], { y: -10, opacity: 0, duration: .4, ease: 'power2.in' }, .05)
        .to(pre, { yPercent: -100, duration: .85, ease: 'power4.inOut' }, .32);
    }
  }

  /* ---------------------------------------------------------
     2. Left-side (or top, on small screens) scroll progress
     --------------------------------------------------------- */
  function initProgressIndicator() {
    var railFill = document.getElementById('progressFill');
    var mobileFill = document.getElementById('progressFillMobile');
    var dots = gsap.utils.toArray('#progressDots li');
    if (!railFill && !mobileFill) return;

    ScrollTrigger.create({
      start: 0,
      end: function () { return document.documentElement.scrollHeight - window.innerHeight; },
      onUpdate: function (self) {
        var pct = (self.progress * 100).toFixed(2) + '%';
        if (railFill) railFill.style.height = pct;
        if (mobileFill) mobileFill.style.width = pct;
      }
    });

    ['hero', 'problem', 'how', 'cta'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var setActive = function () {
        dots.forEach(function (li) { li.classList.toggle('is-active', li.dataset.target === id); });
      };
      ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 45%', onEnter: setActive, onEnterBack: setActive });
    });
  }

  /* ---------------------------------------------------------
     3. Problem section — pinned three-slide presentation
     --------------------------------------------------------- */
  function initProblemPresentation() {
    var pin = document.getElementById('problemPin');
    var stack = document.getElementById('problemStack');
    var stepsWrap = document.getElementById('problemSteps');
    if (!pin || !stack) return;

    var cards = gsap.utils.toArray('.p-card', stack);
    var steps = stepsWrap ? gsap.utils.toArray('.p-step', stepsWrap) : [];
    if (cards.length < 3) return;

    function setActiveIndex(idx) {
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === idx); });
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
    }

    if (reduceMotion) {
      setActiveIndex(0);
      return;
    }

    var mm = gsap.matchMedia();

    mm.add('(min-width:' + (PIN_BREAKPOINT + 1) + 'px)', function () {
      stack.classList.add('is-staged');
      gsap.set(cards[0], { yPercent: 0, rotationX: 0, scale: 1, opacity: 1 });
      gsap.set([cards[1], cards[2]], { yPercent: 34, rotationX: 10, scale: .92, opacity: 0 });
      setActiveIndex(0);

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 1.7); },
          scrub: .8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      tl.to(cards[0], { yPercent: -34, rotationX: -10, scale: .92, opacity: 0, duration: 1, ease: 'power1.inOut' }, 0)
        .to(cards[1], { yPercent: 0, rotationX: 0, scale: 1, opacity: 1, duration: 1, ease: 'power1.inOut' }, 0)
        .to(cards[1], { yPercent: -34, rotationX: -10, scale: .92, opacity: 0, duration: 1, ease: 'power1.inOut' }, 1)
        .to(cards[2], { yPercent: 0, rotationX: 0, scale: 1, opacity: 1, duration: 1, ease: 'power1.inOut' }, 1);

      /* drive the active-state indicator from the timeline's own eased
         playhead (fires every tick, including scrub catch-up) rather
         than the raw scroll progress, so it never lags the visuals */
      tl.eventCallback('onUpdate', function () {
        var p = tl.progress();
        setActiveIndex(p < .25 ? 0 : p < .75 ? 1 : 2);
      });

      return function cleanup() {
        stack.classList.remove('is-staged');
        gsap.set(cards, { clearProps: 'all' });
      };
    });

    mm.add('(max-width:' + PIN_BREAKPOINT + 'px)', function () {
      stack.classList.remove('is-staged');
      gsap.set(cards, { clearProps: 'all' });
      setActiveIndex(0);

      var reveals = cards.map(function (c) {
        return gsap.from(c, {
          opacity: 0, y: 26, duration: .7, ease: 'power2.out',
          scrollTrigger: { trigger: c, start: 'top 88%' }
        });
      });

      return function cleanup() {
        reveals.forEach(function (r) { r.scrollTrigger && r.scrollTrigger.kill(); r.kill(); });
      };
    });
  }

  /* ---------------------------------------------------------
     4. "From confusion to clarity" — pinned feature-card stack
     --------------------------------------------------------- */
  function initClarityPresentation() {
    var pin = document.getElementById('clarityPin');
    var stack = document.getElementById('clarityStack');
    var dotsWrap = document.getElementById('clarityDots');
    if (!pin || !stack) return;

    var cards = gsap.utils.toArray('.f-card', stack);
    var dots = dotsWrap ? gsap.utils.toArray('.c-dot', dotsWrap) : [];
    if (cards.length < 3) return;

    function setActiveIndex(idx) {
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    }

    if (reduceMotion) {
      setActiveIndex(0);
      return;
    }

    var mm = gsap.matchMedia();

    mm.add('(min-width:' + (PIN_BREAKPOINT + 1) + 'px)', function () {
      stack.classList.add('is-staged');
      if (dotsWrap) dotsWrap.classList.add('is-staged');
      gsap.set(cards[0], { yPercent: 0, rotationY: 0, scale: 1, opacity: 1, transformPerspective: 1200 });
      gsap.set([cards[1], cards[2]], { yPercent: 26, rotationY: -14, scale: .9, opacity: 0, transformPerspective: 1200 });
      setActiveIndex(0);

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 1.9); },
          scrub: .8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      tl.to(cards[0], { yPercent: -26, rotationY: 14, scale: .9, opacity: 0, duration: 1, ease: 'power1.inOut' }, 0)
        .to(cards[1], { yPercent: 0, rotationY: 0, scale: 1, opacity: 1, duration: 1, ease: 'power1.inOut' }, 0)
        .to(cards[1], { yPercent: -26, rotationY: 14, scale: .9, opacity: 0, duration: 1, ease: 'power1.inOut' }, 1)
        .to(cards[2], { yPercent: 0, rotationY: 0, scale: 1, opacity: 1, duration: 1, ease: 'power1.inOut' }, 1);

      tl.eventCallback('onUpdate', function () {
        var p = tl.progress();
        setActiveIndex(p < .25 ? 0 : p < .75 ? 1 : 2);
      });

      return function cleanup() {
        stack.classList.remove('is-staged');
        if (dotsWrap) dotsWrap.classList.remove('is-staged');
        gsap.set(cards, { clearProps: 'all' });
      };
    });

    mm.add('(max-width:' + PIN_BREAKPOINT + 'px)', function () {
      stack.classList.remove('is-staged');
      if (dotsWrap) dotsWrap.classList.remove('is-staged');
      gsap.set(cards, { clearProps: 'all' });
      setActiveIndex(0);

      var reveals = cards.map(function (c) {
        return gsap.from(c, {
          opacity: 0, y: 30, duration: .8, ease: 'power2.out',
          scrollTrigger: { trigger: c, start: 'top 88%' }
        });
      });

      return function cleanup() {
        reveals.forEach(function (r) { r.scrollTrigger && r.scrollTrigger.kill(); r.kill(); });
      };
    });
  }

  /* ---------------------------------------------------------
     5. Subtle pointer tilt on large cards (fine pointers only)
     --------------------------------------------------------- */
  function initCardTilt() {
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer || reduceMotion) return;

    gsap.utils.toArray('.p-card, .f-card').forEach(function (card) {
      var rotX = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3.out' });
      var rotY = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3.out' });

      card.addEventListener('mousemove', function (e) {
        // scroll-pinned cards already animate rotationX/Y themselves —
        // only tilt when the card sits in its plain, non-staged layout.
        if (card.closest('.is-staged')) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        rotY(px * 5);
        rotX(py * -5);
      });
      card.addEventListener('mouseleave', function () {
        rotX(0);
        rotY(0);
      });
    });
  }
})();
