/* ============================================================
   INSPIRE AFRICA - Site interactions
   Handles: theme switcher, mobile drawer, scroll reveal,
            sticky header state, back-to-top button.
   ============================================================ */
(function() {
  'use strict';

  // --------------- Theme switcher ---------------
  const STORAGE_KEY = 'inspire-theme';
  const VALID = ['light', 'dark', 'system'];

  function getStoredTheme() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return VALID.includes(v) ? v : 'light';
    } catch (e) { return 'light'; }
  }

  function applyTheme(theme) {
    if (!VALID.includes(theme)) theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    document.querySelectorAll('.theme-switch-option').forEach(btn => {
      btn.setAttribute('aria-checked', btn.dataset.theme === theme ? 'true' : 'false');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  function initThemeSwitcher() {
    const switcher = document.querySelector('.theme-switch');
    if (!switcher) return;
    const trigger = switcher.querySelector('.theme-switch-trigger');
    const menu = switcher.querySelector('.theme-switch-menu');

    applyTheme(getStoredTheme());

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = switcher.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        switcher.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        switcher.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
    menu.querySelectorAll('.theme-switch-option').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
        switcher.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      });
    });

    // React to OS theme changes when in system mode
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        if (getStoredTheme() === 'system') applyTheme('system');
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  // --------------- Mobile drawer ---------------
  function initMobileDrawer() {
    const toggle = document.querySelector('.menu-toggle');
    const drawer = document.querySelector('.mobile-drawer');
    if (!toggle || !drawer) return;

    function open() {
      drawer.classList.add('is-open');
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function close() {
      drawer.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', () => {
      if (drawer.classList.contains('is-open')) close(); else open();
    });
    drawer.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });
    // Close on resize past breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100 && drawer.classList.contains('is-open')) close();
    });
  }

  // --------------- Header scroll state ---------------
  function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let ticking = false;
    function update() {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // --------------- Scroll reveal (robust) ---------------
  function initReveal() {
    // Mark JS as on so the .js prefix in CSS activates reveal
    document.documentElement.classList.add('js');

    // Apply .reveal to a known set of structural elements automatically
    const auto = document.querySelectorAll(
      '.audience-card, .testimonial-card, .step-card, .number, ' +
      '.feature-list li, .process-list li, .hero-photo'
    );
    auto.forEach(el => el.classList.add('reveal'));

    // Reveal anything inside the viewport on load (covers above-the-fold)
    const targets = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything
      targets.forEach(el => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -5% 0px'
    });

    targets.forEach(el => {
      // Anything already in viewport at load: show immediately (no animation)
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        // small delay so transition is visible
        requestAnimationFrame(() => el.classList.add('in'));
      } else {
        io.observe(el);
      }
    });
  }

  // --------------- Back to top ---------------
  function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    let ticking = false;
    function update() {
      if (window.scrollY > 400) btn.classList.add('is-visible');
      else btn.classList.remove('is-visible');
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --------------- Init when DOM ready ---------------
  function init() {
    initThemeSwitcher();
    initMobileDrawer();
    initHeader();
    initReveal();
    initBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
