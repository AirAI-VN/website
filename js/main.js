(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // translated runtime strings come from i18n.js; isVi() drives number formats
  function T(k) { return window.I18N ? window.I18N.t(k) : ''; }
  function isVi() { return document.documentElement.lang === 'vi'; }

  /* ---------- Nav ---------- */
  var nav = document.getElementById('nav');
  var toggle = nav.querySelector('.nav__toggle');

  function menuLabel() { toggle.setAttribute('aria-label', T(nav.classList.contains('is-open') ? 'menu.close' : 'menu.open')); }
  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    menuLabel();
  }
  toggle.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    menuLabel();
  });
  menuLabel();
  nav.querySelectorAll('.nav__menu a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* Active section + gliding highlight.
     The highlight follows the section in view. When a link is clicked it glides straight to
     that link, and the scroll spy is paused until the scroll ends (see slowScrollTo), so it
     does not step through every section passed on the way. */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('.nav__links a'));
  var glide = nav.querySelector('.nav__glide');
  var activeId = null, spyPaused = false;

  function placeGlide() {
    var link = activeId && nav.querySelector('.nav__links a[href="#' + activeId + '"]');
    if (!link || !glide) { if (glide) glide.classList.remove('is-on'); return; }
    glide.style.width = link.offsetWidth + 'px';
    glide.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    glide.classList.add('is-on');
  }
  function setActive(id) {
    activeId = id;
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
    placeGlide();
  }

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      if (spyPaused) return;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        setActive(entry.target.id === 'top' ? null : entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'problem', 'solution', 'product', 'impact', 'about', 'faq'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* In-page links scroll at our own pace: the browser's smooth scroll is too fast for a page
     this long and its speed cannot be set. Duration grows with distance between SCROLL_MIN and
     SCROLL_MAX; raise SCROLL_MS_PER_PX (or the two limits) to slow it further. The scroll spy is
     paused while it runs, and any wheel, touch or key press hands control back to the visitor. */
  var SCROLL_MIN = 1400, SCROLL_MAX = 3200, SCROLL_MS_PER_PX = 0.55;
  var scrollAnim = 0;

  function stopScroll() {
    if (!scrollAnim) return;
    cancelAnimationFrame(scrollAnim);
    scrollAnim = 0;
    spyPaused = false;
  }
  function slowScrollTo(getY, done) {
    stopScroll();
    stopGlide();
    function dest() { return Math.max(0, Math.min(getY(), document.documentElement.scrollHeight - window.innerHeight)); }
    var from = window.scrollY, to = dest();
    if (reduceMotion || Math.abs(to - from) < 2) {
      window.scrollTo({ top: to, behavior: 'instant' });
      if (done) done();
      return;
    }
    var dur = Math.min(SCROLL_MAX, Math.max(SCROLL_MIN, Math.abs(to - from) * SCROLL_MS_PER_PX));
    var t0 = performance.now();
    spyPaused = true;
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   // ease in and out
      to = dest();                                                        // follow late layout shifts (lazy images)
      window.scrollTo({ top: from + (to - from) * e, behavior: 'instant' });
      if (p < 1) { scrollAnim = requestAnimationFrame(step); return; }
      scrollAnim = 0;
      spyPaused = false;
      if (done) done();
    }
    scrollAnim = requestAnimationFrame(step);
  }
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (type) {
    window.addEventListener(type, stopScroll, { passive: true });
  });

  /* Gliding wheel scroll: each mouse-wheel notch moves a target position, and the page eases
     toward it every frame, so scrolling glides and settles instead of jumping in steps.
     Only for wheel mice: touchpads and touch screens already scroll smoothly and keep their
     native feel, as do keyboard scrolling, scrollbar dragging and reduced-motion visitors. */
  var GLIDE = 0.1;            // share of the remaining distance covered per 60 fps frame
  var glideAnim = 0, glideTarget = 0, glidePos = 0, glideLast = 0;

  function stopGlide() {
    if (glideAnim) cancelAnimationFrame(glideAnim);
    glideAnim = 0;
  }
  function maxScroll() { return document.documentElement.scrollHeight - window.innerHeight; }
  // a wheel mouse sends whole notches (about 100 px, or "lines"); a touchpad sends many small deltas
  function isMouseWheel(e) { return e.deltaMode === 1 || (Math.abs(e.deltaY) >= 50 && e.deltaY % 1 === 0); }
  // leave the wheel alone inside anything that scrolls on its own (message box, open menu)
  function insideScroller(el, dy) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      var oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
        if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
      }
    }
    return false;
  }
  function glideStep(now) {   // (not "glide": that name is the nav highlight element above)
    // the first frame's timestamp can predate the wheel event, so never step backwards in time
    var dt = glideLast ? Math.max(0, Math.min(64, now - glideLast)) : 16.67; glideLast = now;
    // someone else moved the page (scrollbar, keyboard, a link): hand control back
    if (Math.abs(window.scrollY - Math.round(glidePos)) > 2) { stopGlide(); return; }
    glidePos += (glideTarget - glidePos) * (1 - Math.pow(1 - GLIDE, dt / 16.67));
    if (Math.abs(glideTarget - glidePos) < 0.5) glidePos = glideTarget;
    window.scrollTo({ top: glidePos, behavior: 'instant' });
    glideAnim = glidePos === glideTarget ? 0 : requestAnimationFrame(glideStep);
  }
  if (!reduceMotion) {
    window.addEventListener('wheel', function (e) {
      if (e.defaultPrevented || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // zoom, sideways
      if (!isMouseWheel(e) || insideScroller(e.target, e.deltaY)) return;
      e.preventDefault();
      if (!glideAnim) { glidePos = glideTarget = window.scrollY; glideLast = 0; }
      var dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      glideTarget = Math.max(0, Math.min(maxScroll(), glideTarget + dy));
      if (!glideAnim) glideAnim = requestAnimationFrame(glideStep);
    }, { passive: false });
  }

  function sectionTop(el) {
    var offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    return el.getBoundingClientRect().top + window.scrollY - offset;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    // contact buttons have their own handler; the skip link must keep its native focus jump
    if (!a || a.hasAttribute('data-contact') || a.classList.contains('skip-link')) return;
    var id = a.getAttribute('href').slice(1), el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (a.closest('.nav__links')) setActive(id);
    else if (a.classList.contains('brand')) setActive(null);
    history.pushState(null, '', '#' + id);
    slowScrollTo(function () { return id === 'top' ? 0 : sectionTop(el); });
  });

  window.addEventListener('resize', placeGlide);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeGlide);
  // link widths change with the language (and its font, which may still be loading)
  document.addEventListener('langchange', function () {
    menuLabel();
    placeGlide();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeGlide);
  });

  /* ---------- Hero video ----------
     Reduced motion: stay on the poster frame. Otherwise pause while the hero is off screen. */
  var heroVideo = document.querySelector('.hero__img');
  if (heroVideo && heroVideo.tagName === 'VIDEO') {
    if (reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); }
        else heroVideo.pause();
      }).observe(heroVideo);
    }
  }

  /* ---------- Scroll reveal, played in both directions ----------
     Elements animate in as they enter the viewport and retract as they leave it.
     data-side remembers which edge an element left by, so it returns from that side. */
  (function () {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    function each(sel, fn) { document.querySelectorAll(sel).forEach(fn); }

    function mark(el, type, delay) {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', type);
      if (delay) el.style.setProperty('--d', delay + 'ms');
    }

    // wrap every word in a clipping span so headlines can rise line by line
    function splitWords(el) {
      var nodes = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), i = 0;
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var outer = document.createElement('span'), inner = document.createElement('span');
          outer.className = 'w'; inner.className = 'w__i';
          inner.style.setProperty('--i', i++);
          inner.textContent = part;
          outer.appendChild(inner); frag.appendChild(outer);
        });
        node.parentNode.replaceChild(frag, node);
      });
      mark(el, 'words');
    }

    // headlines
    each('.hero h1, h2:not(.footer__h), .h3-large', splitWords);
    // a language switch replaces headline text, so split the new words again
    document.addEventListener('langchange', function () {
      each('[data-reveal="words"]', function (el) { if (!el.querySelector('.w')) splitWords(el); });
    });
    document.querySelector('.hero h1').setAttribute('data-delay', 350);   // let the photo settle first

    // Problem opener and the Solution demo
    each('.opener__lede, .opener__actions, .demo', function (el) { mark(el, 'fade'); });

    // single blocks of text
    each([
      '.lede', '.split__text > p', '.source', '.edge__text > p', '.proof__intro',
      '.fit__text h3', '.fit__text p', '.note', '.target__lead', '.target__note',
      '.calc__in', '.closing__actions', '.contact__intro', '.contact__card', '.footer__about', '.footer__nav', '.about__text p', '.about__photo'
    ].join(','), function (el) { mark(el, 'fade'); });
    mark(document.querySelector('.target__num'), 'rise');

    // members of a set are watched one by one, so tall sets (cards, phases, rows) react item by item
    each([
      '.figures', '.steps', '.safeguards', '.proof__list', '.plans', '.fit__table tbody',
      '.outcomes', '.esg__cols', '.calc__out', '.faq__list'
    ].join(','), function (set) {
      Array.prototype.forEach.call(set.children, function (child) { mark(child, 'item'); });
    });

    // graphics that draw themselves
    each('.scale, .share', function (el) { mark(el, 'grow'); });

    /* The "stage" is the viewport minus 8% at the top and 16% at the bottom.
       An element retracts as soon as it has fully left the stage, while it is still visible
       in the bottom (or top) band of the screen, so the exit is clearly seen. The hidden
       offset moves the element away from the stage, which gives a natural hysteresis and
       prevents flicker at the boundary. */
    var io = new IntersectionObserver(function (entries) {
      var entering = [];
      entries.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          if (!el.classList.contains('is-in')) entering.push(e);
        } else {
          var top = e.rootBounds ? e.rootBounds.top : 0;
          el.setAttribute('data-side', e.boundingClientRect.top < top ? 'above' : 'below');
          el.classList.remove('is-in');
        }
      });
      // stagger only among elements that arrive together, in reading order
      entering.sort(function (a, b) {
        return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left);
      });
      entering.forEach(function (e, k) {
        var fixed = e.target.getAttribute('data-delay');
        e.target.style.setProperty('--d', (fixed !== null ? +fixed : Math.min(k, 6) * 90) + 'ms');
        e.target.classList.add('is-in');
      });
    }, { rootMargin: '-8% 0px -16% 0px', threshold: 0 });

    // wait two frames so the hidden state is painted before anything animates in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        each('[data-reveal]', function (el) { io.observe(el); });
      });
    });

    // the two section photos (rooftop units, ducts) stay still: the user removed their scroll animation
  })();

  /* ---------- Solution boxes: hover shows the text (CSS); tap or keyboard toggles it ---------- */
  var canHover = window.matchMedia('(hover: hover)');
  document.querySelectorAll('.step').forEach(function (step) {
    function toggle() {
      var open = !step.classList.contains('is-open');
      document.querySelectorAll('.step.is-open').forEach(function (s) { s.classList.remove('is-open'); });
      step.classList.toggle('is-open', open);
    }
    step.addEventListener('click', function () { if (!canHover.matches) toggle(); });
    step.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    step.addEventListener('blur', function () { if (canHover.matches) step.classList.remove('is-open'); });
  });

  /* ---------- FAQ: each question opens and closes on its own ---------- */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var btn = item.querySelector('.faq__q button'), panel = item.querySelector('.faq__a');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
      if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');   // closed answers stay out of tab order
    });
  });

  /* ---------- Contact form, delivered by Web3Forms ----------
     The access key lives in data-key on the form. Without it, Send asks visitors to email us.
     Messages and errors are stored as i18n keys so they re-translate on a language switch. */
  var form = document.querySelector('.contact__form');
  if (form) {
    var statusEl = form.querySelector('.contact__status');
    var sendBtn = form.querySelector('button[type="submit"]');
    var doneEl = document.querySelector('.contact__done');
    var REQUIRED = [['cf-name', 'form.errName'], ['cf-email', 'form.errEmail'], ['cf-message', 'form.errMessage']];
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setError(input, key) {
      var err = document.getElementById(input.id + '-err');
      input.setAttribute('aria-invalid', String(!!key));
      if (!err) return;
      err.setAttribute('data-msg', key || '');
      err.textContent = key ? T(key) : '';
      err.hidden = !key;
    }
    function setStatus(key, tone) {
      statusEl.setAttribute('data-msg', key || '');
      statusEl.setAttribute('data-tone', tone || '');
      statusEl.textContent = key ? T(key) : '';
    }
    function validate() {
      var first = null;
      REQUIRED.forEach(function (pair) {
        var el = document.getElementById(pair[0]), v = el.value.trim();
        var bad = !v || (el.type === 'email' && !EMAIL_RE.test(v));
        setError(el, bad ? pair[1] : null);
        if (bad && !first) first = el;
      });
      return first;
    }

    // clear a field's error as soon as the visitor fixes it
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, null);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = validate();
      if (first) { first.focus(); return; }
      if (form.elements.botcheck.checked) return;               // a bot filled the hidden box

      // Two destinations, both optional: Web3Forms emails the message (data-key) and a
      // Google Apps Script web app adds it as a row to the enquiries sheet (data-sheet).
      var key = form.getAttribute('data-key'), sheetUrl = form.getAttribute('data-sheet');
      if (!key && !sheetUrl) { setStatus('form.notConnected', 'warn'); return; }

      function val(id) { return document.getElementById(id).value.trim(); }
      var fields = {
        name: val('cf-name'), email: val('cf-email'), role: val('cf-role'),
        organisation: val('cf-org'), floor_area_m2: val('cf-area'), message: val('cf-message')
      };
      var sends = [];
      if (key) {
        var mail = { access_key: key, subject: 'New enquiry from the AirAI website', from_name: 'AirAI website' };
        Object.keys(fields).forEach(function (k) { mail[k] = fields[k]; });
        sends.push(fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(mail)
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            // Web3Forms' own reply, kept in the console to diagnose delivery problems
            if (window.console) console.info('Web3Forms:', res.success, res.message);
            if (!res.success) throw new Error('Web3Forms: ' + (res.message || 'failed'));
          }));
      }
      if (sheetUrl) {
        fields.lang = document.documentElement.lang;
        // text/plain keeps this a "simple" request (no CORS preflight, which Apps Script can't answer);
        // the reply is opaque, so a network error is the only failure we can see
        sends.push(fetch(sheetUrl, {
          method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(fields)
        }));
      }

      sendBtn.disabled = true;
      setStatus('form.sending');
      Promise.allSettled(sends).then(function (results) {
        results.forEach(function (r) {
          if (r.status === 'rejected' && window.console) console.warn('Contact form:', r.reason && r.reason.message);
        });
        if (results.some(function (r) { return r.status === 'fulfilled'; })) {
          setStatus(null);
          form.hidden = true;
          doneEl.hidden = false;
          doneEl.focus();
        } else {
          setStatus('form.error', 'err');
        }
        sendBtn.disabled = false;
      });
    });

    document.addEventListener('langchange', function () {
      form.querySelectorAll('[data-msg]').forEach(function (el) {
        var k = el.getAttribute('data-msg');
        if (k) el.textContent = T(k);
      });
    });
  }

  /* ---------- Calls to action: go to contact and highlight it ---------- */
  var contact = document.getElementById('contact');
  document.querySelectorAll('[data-contact]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      history.replaceState(null, '', '#contact');
      slowScrollTo(function () {
        var r = contact.getBoundingClientRect(), top = r.top + window.scrollY;
        var offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        // centre the form card, or align its top under the nav when it is taller than the screen
        return r.height > window.innerHeight - offset - 40 ? top - offset - 16 : top - (window.innerHeight - r.height) / 2;
      }, function () {
        contact.focus({ preventScroll: true });
        contact.classList.add('is-flash');
        setTimeout(function () { contact.classList.remove('is-flash'); }, 2400);
      });
    });
  });

  /* ---------- Savings estimator ---------- */
  var EUI = 105.9, HVAC_SHARE = 0.55, PRICE = 4000, GRID = 0.6592, FX = 25000, GAIN = 0.15;
  var AREA_MIN = 1000, AREA_MAX = 100000, REF_AREA = 15000;
  var area = document.getElementById('area');
  var areaRange = document.getElementById('areaRange');
  var areaErr = document.getElementById('area-err');
  var rates = document.querySelectorAll('input[name="rate"]');
  var out = {
    kwh: document.getElementById('oKwh'), vnd: document.getElementById('oVnd'), usd: document.getElementById('oUsd'),
    co2: document.getElementById('oCo2'), owner: document.getElementById('oOwner'), airai: document.getElementById('oAirai')
  };

  // 174,735 and 698.9M in English; 174.735 and 698,9 triệu in Vietnamese
  function num(v, digits) {
    return v.toLocaleString(isVi() ? 'vi-VN' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function fmtVnd(v) {
    if (v >= 1e9) return num(v / 1e9, 2) + (isVi() ? ' tỷ' : 'B');
    return num(v / 1e6, 1) + (isVi() ? ' triệu' : 'M');
  }
  function currentRate() {
    var r = 0.2;
    rates.forEach(function (x) { if (x.checked) r = parseFloat(x.value); });
    return r;
  }
  function paintRange() {
    var pct = (areaRange.value - areaRange.min) / (areaRange.max - areaRange.min) * 100;
    areaRange.style.setProperty('--p', pct + '%');
  }
  function calc() {
    paintRange();
    var a = parseFloat(area.value);
    var valid = !isNaN(a) && a >= AREA_MIN && a <= AREA_MAX;
    area.setAttribute('aria-invalid', String(!valid));
    areaErr.hidden = valid;
    if (!valid) return;
    var kwh = a * EUI * HVAC_SHARE * currentRate();
    var vnd = kwh * PRICE;
    var usd = num(Math.round(vnd / FX / 100) * 100, 0), dong = isVi() ? ' đồng' : ' VND';
    out.kwh.textContent = num(Math.round(kwh), 0);
    out.vnd.textContent = fmtVnd(vnd);
    out.usd.textContent = isVi() ? 'khoảng ' + usd + ' USD' : 'about USD ' + usd;
    out.co2.textContent = num(kwh / 1000 * GRID, 1);
    out.owner.textContent = fmtVnd(vnd * (1 - GAIN)) + dong;
    out.airai.textContent = fmtVnd(vnd * GAIN) + dong;
  }
  document.addEventListener('langchange', calc);
  area.addEventListener('input', function () {
    var a = parseFloat(area.value);
    if (!isNaN(a)) areaRange.value = Math.min(Math.max(a, AREA_MIN), +areaRange.max);
    calc();
  });
  areaRange.addEventListener('input', function () { area.value = areaRange.value; calc(); });
  rates.forEach(function (r) { r.addEventListener('change', calc); });
  document.getElementById('estReset').addEventListener('click', function () {
    area.value = REF_AREA; areaRange.value = REF_AREA;
    rates.forEach(function (r) { r.checked = r.value === '0.20'; });
    calc();
  });
  calc();

  /* ---------- Hero: building cross-section with airflow ---------- */
  var canvas = document.getElementById('building');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  // Illustrative occupancy per floor, top floor first. Four floors are empty.
  var OCC = [0.85, 0, 0.4, 1, 0, 0.6, 0.15, 0, 0.9];
  var MIN_AIR = 0.05; // fresh-air minimum AirAI keeps on empty floors

  var mode = 'fixed';
  var flow = OCC.map(function () { return 1; });
  var parts = [];
  var W = 0, H = 0, g = null, running = true, raf = 0, interacted = false;
  var caption = document.getElementById('vizCaption');
  var buttons = document.querySelectorAll('.toggle button');

  function target(i) { return mode === 'fixed' ? 1 : Math.max(MIN_AIR, OCC[i]); }

  function layout() {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = OCC.length;
    var bx = W * 0.06, bw = W * 0.88, roof = H * 0.1, ground = H * 0.97;
    var fh = (ground - roof) / n, shaft = Math.max(12, bw * 0.06);
    var x0 = bx + shaft + bw * 0.1, x1 = bx + bw - bw * 0.06;
    g = { n: n, bx: bx, bw: bw, roof: roof, ground: ground, fh: fh, shaft: shaft, start: bx + shaft, end: bx + bw - 4, people: [] };
    for (var i = 0; i < n; i++) {
      var count = Math.round(OCC[i] * 7), row = [];
      for (var k = 0; k < count; k++) {
        var jitter = (((k * 37 + i * 13) % 10) / 10 - 0.5) * 0.5;
        row.push(x0 + (x1 - x0) * ((k + 0.5 + jitter) / 7));
      }
      g.people.push(row);
    }
    if (reduceMotion) seedStatic();
  }

  function spawn(i, x) {
    var y = g.roof + g.fh * (i + 0.5) + (Math.random() - 0.5) * g.fh * 0.5;
    // each streak crosses the floor in roughly 1.5 to 2.5 seconds, whatever the canvas width
    var frames = 90 + Math.random() * 60;
    parts.push({ i: i, x: x, y: y, v: (g.end - g.start) / frames, len: 8 + Math.random() * 14 });
  }

  function seedStatic() {
    parts = [];
    for (var i = 0; i < g.n; i++) {
      var c = Math.round(target(i) * 14);
      for (var k = 0; k < c; k++) spawn(i, g.start + (g.end - g.start) * ((k + 0.5) / 14));
      flow[i] = target(i);
    }
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, W, H);
    var line = 'rgba(232,240,246,0.22)';

    // rooftop plant
    ctx.strokeStyle = 'rgba(232,240,246,0.35)'; ctx.lineWidth = 1;
    for (var u = 0; u < 3; u++) {
      var ux = g.bx + g.bw * (0.5 + u * 0.14), uw = g.bw * 0.1, uh = g.fh * 0.42;
      ctx.strokeRect(ux + 0.5, g.roof - uh + 0.5, uw, uh);
    }

    // empty floors glow amber in proportion to the air still being sent there
    for (var i = 0; i < g.n; i++) {
      if (OCC[i] === 0) {
        var waste = (flow[i] - MIN_AIR) / (1 - MIN_AIR);
        var gy = g.roof + g.fh * i + 1;
        var wash = ctx.createLinearGradient(g.start, 0, g.bx + g.bw, 0);
        wash.addColorStop(0, 'rgba(244,184,96,' + (0.34 * waste).toFixed(3) + ')');
        wash.addColorStop(1, 'rgba(244,184,96,' + (0.12 * waste).toFixed(3) + ')');
        ctx.fillStyle = wash;
        ctx.fillRect(g.start, gy, g.bw - g.shaft, g.fh - 1);
      }
    }

    // shell and floor plates
    ctx.strokeStyle = 'rgba(232,240,246,0.5)';
    ctx.strokeRect(g.bx + 0.5, g.roof + 0.5, g.bw, g.ground - g.roof);
    ctx.strokeStyle = line;
    for (var f = 1; f < g.n; f++) {
      var fy = Math.round(g.roof + g.fh * f) + 0.5;
      ctx.beginPath(); ctx.moveTo(g.bx, fy); ctx.lineTo(g.bx + g.bw, fy); ctx.stroke();
    }

    // supply shaft
    ctx.fillStyle = 'rgba(107,207,237,0.07)';
    ctx.fillRect(g.bx + 1, g.roof + 1, g.shaft, g.ground - g.roof - 1);
    ctx.strokeStyle = 'rgba(107,207,237,0.4)';
    ctx.beginPath(); ctx.moveTo(g.start + 0.5, g.roof); ctx.lineTo(g.start + 0.5, g.ground); ctx.stroke();
    var total = flow.reduce(function (a, b) { return a + b; }, 0) / g.n;
    ctx.fillStyle = 'rgba(107,207,237,' + (0.35 + 0.5 * total).toFixed(2) + ')';
    var step = g.fh * 0.5, off = reduceMotion ? 0 : (t / 30) % step;
    var dash = step * 0.45 * (0.4 + total);
    for (var sy = g.roof + off; sy < g.ground; sy += step) {
      // clip the last dash at ground level so it never runs below the building
      ctx.fillRect(g.bx + g.shaft / 2 - 1, sy, 2, Math.min(dash, g.ground - sy));
    }

    // airflow streaks
    for (var p = 0; p < parts.length; p++) {
      var q = parts[p];
      var prog = (q.x - g.start) / (g.end - g.start);
      var a = Math.min(1, prog * 6) * (1 - Math.pow(prog, 3)) * 0.85;
      var grad = ctx.createLinearGradient(q.x - q.len, 0, q.x, 0);
      grad.addColorStop(0, 'rgba(107,207,237,0)');
      grad.addColorStop(1, 'rgba(107,207,237,' + a.toFixed(3) + ')');
      ctx.strokeStyle = grad; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(Math.max(g.start, q.x - q.len), q.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    }

    // people
    var r = Math.max(2.5, Math.min(4.5, g.fh * 0.09));
    ctx.fillStyle = '#FFFFFF';
    for (var fl = 0; fl < g.n; fl++) {
      var py = g.roof + g.fh * (fl + 0.72);
      for (var k = 0; k < g.people[fl].length; k++) {
        ctx.beginPath(); ctx.arc(g.people[fl][k], py, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function tick(t) {
    for (var i = 0; i < g.n; i++) {
      flow[i] += (target(i) - flow[i]) * 0.03;
      if (Math.random() < flow[i] * 0.5) spawn(i, g.start);
    }
    for (var p = parts.length - 1; p >= 0; p--) {
      parts[p].x += parts[p].v;
      if (parts[p].x > g.end) parts.splice(p, 1);
    }
    drawFrame(t);
    if (running) raf = requestAnimationFrame(tick);
  }

  function setMode(m, byUser) {
    if (byUser) interacted = true;
    if (m === mode) return;
    mode = m;
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
    describe();
    if (reduceMotion) { seedStatic(); drawFrame(0); }
  }
  function describe() {
    caption.textContent = T('viz.cap.' + mode);
    canvas.setAttribute('aria-label', T('viz.label.' + mode));
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-mode'), true); });
  });
  describe();
  document.addEventListener('langchange', describe);

  layout();
  if (reduceMotion) {
    drawFrame(0);
  } else {
    // prefill the floors so the first frame already shows airflow
    for (var s = 0; s < 240; s++) {
      for (var i = 0; i < g.n; i++) if (Math.random() < 0.42) spawn(i, g.start);
      for (var p = parts.length - 1; p >= 0; p--) { parts[p].x += parts[p].v; if (parts[p].x > g.end) parts.splice(p, 1); }
    }
    raf = requestAnimationFrame(tick);
    var autoSwitchQueued = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (running) raf = requestAnimationFrame(tick);
        // one orchestrated moment: 3s after the demo is first seen, show the switch once,
        // unless the visitor gets there first
        if (running && !autoSwitchQueued) {
          autoSwitchQueued = true;
          setTimeout(function () { if (!interacted) setMode('ai', false); }, 3000);
        }
      }).observe(canvas);
    } else {
      setTimeout(function () { if (!interacted) setMode('ai', false); }, 4200);
    }
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var oldStart = g.start, oldSpan = g.end - g.start, oldRoof = g.roof, oldFh = g.fh;
      layout();
      if (!reduceMotion) parts.forEach(function (q) {
        q.x = g.start + (q.x - oldStart) / oldSpan * (g.end - g.start);
        q.y = g.roof + (q.y - oldRoof) / oldFh * g.fh;
      });
      drawFrame(performance.now());
    }, 120);
  });
})();
