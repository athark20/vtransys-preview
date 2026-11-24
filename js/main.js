/* VTRANSYS Solutions · site behaviour
   Plain JavaScript, no dependencies. Everything degrades: with JS off the page is
   fully readable (see the .no-js rules in styles.css). */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: scrolled state, mobile menu ---------- */
  var header = doc.querySelector('[data-header]');
  var nav = doc.getElementById('site-nav');
  var toggle = doc.querySelector('[data-nav-toggle]');
  var toTop = doc.querySelector('[data-to-top]');

  function setNavHeight() {
    if (header) root.style.setProperty('--nav-h', header.offsetHeight + 'px');
  }
  function onScroll() {
    var y = window.scrollY || root.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
    setNavHeight();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', setNavHeight);
  onScroll();

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    doc.body.style.overflow = '';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      doc.body.style.overflow = open ? 'hidden' : '';
      setNavHeight();
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    window.matchMedia('(min-width: 901px)').addEventListener('change', closeNav);
  }

  /* ---------- Scroll reveals and counters ---------- */
  var revealEls = doc.querySelectorAll('[data-reveal], [data-stagger], .timeline li');
  var counters = doc.querySelectorAll('[data-count]');

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduce || !isFinite(target)) { el.textContent = target; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        animateCount(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Forms: validate, submit without leaving the page ---------- */
  doc.querySelectorAll('[data-form]').forEach(function (form) {
    var msg = form.querySelector('.form__msg');
    function say(text, ok) {
      if (!msg) return;
      msg.textContent = text;
      msg.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (f) {
        var bad = !f.checkValidity();
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        return bad;
      });
      if (invalid.length) {
        invalid[0].focus();
        say('Please complete the highlighted fields.', false);
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      var action = form.getAttribute('action') || '';
      if (action.indexOf('REPLACE_ME') !== -1) {
        // Endpoint not configured yet: behave as a demo and tell the visitor where to write.
        setTimeout(function () {
          say('Thank you. The form endpoint is not connected on this preview, so please email sales@vtransys.in or call +91 97631 87979.', true);
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
          form.reset();
        }, 600);
        return;
      }
      fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json ? r.json() : {}; })
        .then(function () { say('Thank you. Your message is on its way; an engineer will reply by email or phone.', true); form.reset(); })
        .catch(function () { say('We could not send that just now. Please email sales@vtransys.in or call +91 97631 87979.', false); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
    });
  });

  /* Preselect the product in the contact form from ?product= */
  var sel = doc.querySelector('[data-product-select]');
  if (sel) {
    var m = /[?&]product=([^&#]+)/.exec(location.search);
    if (m) {
      var v = decodeURIComponent(m[1]);
      Array.prototype.forEach.call(sel.options, function (o) { if (o.value === v) sel.value = v; });
    }
  }

  /* ---------- Map: load on request ---------- */
  var map = doc.querySelector('[data-map]');
  if (map) {
    var load = map.querySelector('[data-map-load]');
    load && load.addEventListener('click', function () {
      var f = doc.createElement('iframe');
      f.src = map.getAttribute('data-src');
      f.title = 'Map showing the VTRANSYS Solutions office in Rahatni, Pune';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      map.innerHTML = '';
      map.appendChild(f);
      map.classList.add('is-loaded');
    });
  }

  /* ---------- Footer year ---------- */
  var y = doc.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
