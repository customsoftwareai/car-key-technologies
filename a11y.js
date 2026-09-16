/*!
 * Car Key Technologies — Accessibility Menu & Theme Toggle
 * ---------------------------------------------------------
 * Self-contained, dependency-free widget that:
 *   1. Adds skip links + a <main> landmark (WCAG 2.2 AA baseline fix)
 *   2. Adds a quick light/dark theme toggle (top of page)
 *   3. Adds a floating "Accessibility options" launcher + panel with
 *      visual/reading, motion, and structural aids
 *
 * Settings persist in localStorage under "a11y_prefs_v1".
 * No tracking, no external calls except the (optional) Atkinson
 * Hyperlegible webfont, which is only requested if the user turns on
 * the dyslexia-friendly font toggle.
 *
 * NOTE: This widget is an aid, not a substitute for accessible markup.
 * It is paired with real fixes (skip links, landmarks, focus styles,
 * keyboard support) that work whether or not JavaScript loads.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'a11y_prefs_v1';
  var DEFAULT_THEME = 'light'; // this site is light-by-default with dark hero/footer accents

  var TEXT_STEPS = [100, 110, 125, 150, 175, 200];
  var LINE_STEPS = ['normal', 'plus20', 'plus40'];

  var defaults = {
    theme: DEFAULT_THEME, // 'light' | 'dark' | 'high-contrast'
    textSize: 100,
    lineSpacing: 'normal',
    highlightLinks: false,
    dyslexiaFont: false,
    readingGuide: false,
    bigCursor: false,
    focusRing: false,
    reduceMotion: null // null = "not set by user"; resolved against prefers-reduced-motion at init
  };

  var prefs = loadPrefs();
  var root = document.documentElement;
  var dialogOpen = false;
  var lastFocused = null;

  // ---------- persistence ----------
  function loadPrefs() {
    var out = {};
    for (var k in defaults) out[k] = defaults[k];
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        for (var key in saved) {
          if (Object.prototype.hasOwnProperty.call(out, key)) out[key] = saved[key];
        }
      }
    } catch (e) { /* localStorage unavailable — fall back to in-memory defaults */ }
    return out;
  }

  function savePrefs() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  // ---------- structural fixes: landmarks + skip links ----------
  function ensureLandmarks() {
    var body = document.body;
    var header = body.querySelector(':scope > header');
    var footer = body.querySelector(':scope > footer');

    if (footer && !footer.id) footer.id = 'a11y-footer';
    var nav = (header && header.querySelector('nav')) || body.querySelector('nav');
    if (nav && !nav.id) nav.id = 'a11y-nav';

    var main = body.querySelector(':scope > main');
    if (!main && header) {
      main = document.createElement('main');
      main.id = 'a11y-main';
      var node = header.nextSibling;
      var toMove = [];
      while (node && node !== footer) {
        var next = node.nextSibling;
        toMove.push(node);
        node = next;
      }
      toMove.forEach(function (n) { main.appendChild(n); });
      header.parentNode.insertBefore(main, footer || null);
    } else if (main && !main.id) {
      main.id = 'a11y-main';
    }
    if (main) main.setAttribute('tabindex', '-1');

    return { main: main, nav: nav, footer: footer, header: header };
  }

  function addSkipLinks(landmarks) {
    var wrap = document.createElement('div');
    wrap.id = 'a11y-skip-links';

    var links = [
      { href: '#' + (landmarks.main ? landmarks.main.id : ''), label: 'Skip to main content' },
      { href: '#' + (landmarks.nav ? landmarks.nav.id : ''), label: 'Skip to navigation' },
      { href: '#' + (landmarks.footer ? landmarks.footer.id : ''), label: 'Skip to footer' }
    ];

    links.forEach(function (l) {
      if (l.href === '#') return; // target not found on this page — skip it
      var a = document.createElement('a');
      a.href = l.href;
      a.className = 'a11y-skip-link';
      a.textContent = l.label;
      wrap.appendChild(a);
    });

    if (wrap.children.length) document.body.insertBefore(wrap, document.body.firstChild);
  }

  // ---------- theme (quick toggle + menu radio share this) ----------
  function applyTheme(theme) {
    prefs.theme = theme;
    root.classList.remove('a11y-contrast-high');
    if (theme === 'high-contrast') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('a11y-contrast-high');
    } else {
      root.setAttribute('data-theme', theme);
    }
    updateThemeToggleUI();
    updateMenuThemeRadiosUI();
    savePrefs();
  }

  function updateThemeToggleUI() {
    var btn = document.getElementById('a11y-theme-toggle');
    if (!btn) return;
    var isDark = prefs.theme !== 'light';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
  }

  function mountThemeToggle() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'a11y-theme-toggle';
    btn.className = 'a11y-theme-toggle';
    btn.addEventListener('click', function () {
      applyTheme(prefs.theme === 'light' ? 'dark' : 'light');
    });

    var target = document.querySelector('.nav-cta');
    if (target) {
      target.insertBefore(btn, target.firstChild);
    } else {
      var header = document.querySelector('header') || document.body;
      header.style.position = header.style.position || 'relative';
      btn.classList.add('a11y-theme-toggle-standalone');
      header.appendChild(btn);
    }
    updateThemeToggleUI();
  }

  var ICONS = {
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>',
    a11y: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="4.2" r="1.7"/><path d="M4.5 8.2c2.3.9 5 1.4 7.5 1.4s5.2-.5 7.5-1.4M12 9.6v4.1l-3 7.4M12 13.7l3 7.4M9 12.4l-1.6 3.4M15 12.4l1.6 3.4"/></svg>'
  };

  // ---------- floating accessibility launcher + panel ----------
  function mountAccessibilityMenu(landmarks) {
    var launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.id = 'a11y-launcher';
    launcher.className = 'a11y-launcher';
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Accessibility options');
    launcher.innerHTML = ICONS.a11y + '<span class="a11y-launcher-label">Accessibility options</span>';
    document.body.appendChild(launcher);

    var overlay = document.createElement('div');
    overlay.id = 'a11y-overlay';
    overlay.className = 'a11y-overlay';
    overlay.hidden = true;
    document.body.appendChild(overlay);

    var dialog = buildDialog(landmarks);
    document.body.appendChild(dialog);

    launcher.addEventListener('click', function () { openDialog(); });
    overlay.addEventListener('click', function () { closeDialog(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dialogOpen) closeDialog();
    });
  }

  function openDialog() {
    lastFocused = document.activeElement;
    var dialog = document.getElementById('a11y-dialog');
    var overlay = document.getElementById('a11y-overlay');
    var launcher = document.getElementById('a11y-launcher');
    dialog.hidden = false;
    overlay.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    dialogOpen = true;
    var first = dialog.querySelector('.a11y-close, button, [href], input, select, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
    dialog.addEventListener('keydown', trapFocus);
  }

  function closeDialog() {
    var dialog = document.getElementById('a11y-dialog');
    var overlay = document.getElementById('a11y-overlay');
    var launcher = document.getElementById('a11y-launcher');
    dialog.hidden = true;
    overlay.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    dialogOpen = false;
    dialog.removeEventListener('keydown', trapFocus);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    else launcher.focus();
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var dialog = document.getElementById('a11y-dialog');
    var focusable = Array.prototype.slice.call(
      dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!focusable.length) return;
    var firstEl = focusable[0];
    var lastEl = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault(); lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault(); firstEl.focus();
    }
  }

  function buildDialog(landmarks) {
    var dialog = document.createElement('div');
    dialog.id = 'a11y-dialog';
    dialog.className = 'a11y-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'a11y-dialog-title');
    dialog.hidden = true;

    dialog.innerHTML =
      '<div class="a11y-dialog-header">' +
        '<h2 id="a11y-dialog-title">Accessibility options</h2>' +
        '<button type="button" class="a11y-close" aria-label="Close accessibility options">&times;</button>' +
      '</div>' +
      '<div class="a11y-dialog-body">' +

        '<section class="a11y-group" aria-labelledby="a11y-h-text">' +
          '<h3 id="a11y-h-text">Text size</h3>' +
          '<div class="a11y-row">' +
            '<button type="button" class="a11y-btn" id="a11y-text-dec" aria-label="Decrease text size">&minus;</button>' +
            '<span class="a11y-value" id="a11y-text-value" aria-live="polite">100%</span>' +
            '<button type="button" class="a11y-btn" id="a11y-text-inc" aria-label="Increase text size">&plus;</button>' +
            '<button type="button" class="a11y-btn a11y-btn-text" id="a11y-text-reset">Reset</button>' +
          '</div>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="a11y-h-line">' +
          '<h3 id="a11y-h-line">Line spacing</h3>' +
          '<div class="a11y-row" role="radiogroup" aria-labelledby="a11y-h-line" id="a11y-line-group">' +
            radioBtn('line', 'normal', 'Normal') +
            radioBtn('line', 'plus20', '+20%') +
            radioBtn('line', 'plus40', '+40%') +
          '</div>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="a11y-h-theme">' +
          '<h3 id="a11y-h-theme">Contrast theme</h3>' +
          '<div class="a11y-row" role="radiogroup" aria-labelledby="a11y-h-theme" id="a11y-theme-group">' +
            radioBtn('theme', 'light', 'Light') +
            radioBtn('theme', 'dark', 'Dark') +
            radioBtn('theme', 'high-contrast', 'High contrast') +
          '</div>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="a11y-h-links">' +
          '<h3 id="a11y-h-links">Links</h3>' +
          checkboxRow('highlightLinks', 'Highlight links') +
          '<p class="a11y-note">Links are always underlined throughout the site so they don’t rely on color alone.</p>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="a11y-h-reading">' +
          '<h3 id="a11y-h-reading">Reading aids</h3>' +
          checkboxRow('dyslexiaFont', 'Dyslexia-friendly font (Atkinson Hyperlegible)') +
          checkboxRow('readingGuide', 'Reading guide (use ↑ / ↓ to move it)') +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="a11y-h-cursor">' +
          '<h3 id="a11y-h-cursor">Cursor &amp; focus</h3>' +
          checkboxRow('bigCursor', 'Big cursor') +
          checkboxRow('focusRing', 'Always-visible, high-contrast focus ring') +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="a11y-h-motion">' +
          '<h3 id="a11y-h-motion">Motion &amp; media</h3>' +
          checkboxRow('reduceMotion', 'Reduce motion') +
          '<button type="button" class="a11y-btn a11y-btn-text" id="a11y-pause-media">Pause all media</button>' +
        '</section>' +

        '<div class="a11y-row a11y-actions">' +
          '<button type="button" class="a11y-btn a11y-btn-reset" id="a11y-reset-all">Reset all settings</button>' +
        '</div>' +

        '<p class="a11y-note a11y-disclaimer">This menu adjusts how the site displays for you. It doesn’t replace the underlying accessibility work — see our <a href="accessibility-statement.html">Accessibility Statement</a>.</p>' +
      '</div>';

    wireDialog(dialog, landmarks);
    return dialog;
  }

  function radioBtn(group, value, label) {
    return '<label class="a11y-radio">' +
      '<input type="radio" name="a11y-' + group + '" value="' + value + '"> ' + label +
      '</label>';
  }
  function checkboxRow(key, label) {
    return '<label class="a11y-checkbox">' +
      '<input type="checkbox" id="a11y-cb-' + key + '" data-pref="' + key + '"> ' + label +
      '</label>';
  }

  function wireDialog(dialog, landmarks) {
    dialog.querySelector('.a11y-close').addEventListener('click', closeDialog);

    dialog.querySelector('#a11y-text-inc').addEventListener('click', function () { stepTextSize(1); });
    dialog.querySelector('#a11y-text-dec').addEventListener('click', function () { stepTextSize(-1); });
    dialog.querySelector('#a11y-text-reset').addEventListener('click', function () { setTextSize(100); });

    Array.prototype.forEach.call(dialog.querySelectorAll('input[name="a11y-line"]'), function (r) {
      r.addEventListener('change', function () { setLineSpacing(r.value); });
    });
    Array.prototype.forEach.call(dialog.querySelectorAll('input[name="a11y-theme"]'), function (r) {
      r.addEventListener('change', function () { applyTheme(r.value); });
    });

    Array.prototype.forEach.call(dialog.querySelectorAll('input[type="checkbox"][data-pref]'), function (cb) {
      cb.addEventListener('change', function () {
        setBoolPref(cb.getAttribute('data-pref'), cb.checked);
      });
    });

    dialog.querySelector('#a11y-pause-media').addEventListener('click', pauseAllMedia);
    dialog.querySelector('#a11y-reset-all').addEventListener('click', resetAll);
  }

  // ---------- pref setters ----------
  function stepTextSize(dir) {
    var i = TEXT_STEPS.indexOf(prefs.textSize);
    if (i === -1) i = 0;
    i = Math.max(0, Math.min(TEXT_STEPS.length - 1, i + dir));
    setTextSize(TEXT_STEPS[i]);
  }
  function setTextSize(size) {
    TEXT_STEPS.forEach(function (s) { root.classList.remove('a11y-text-' + s); });
    if (size !== 100) root.classList.add('a11y-text-' + size);
    prefs.textSize = size;
    var val = document.getElementById('a11y-text-value');
    if (val) val.textContent = size + '%';
    savePrefs();
  }

  function setLineSpacing(v) {
    LINE_STEPS.forEach(function (s) { root.classList.remove('a11y-line-' + s); });
    if (v !== 'normal') root.classList.add('a11y-line-' + v);
    prefs.lineSpacing = v;
    savePrefs();
  }

  function setBoolPref(key, val) {
    prefs[key] = val;
    var classMap = {
      highlightLinks: 'a11y-highlight-links',
      dyslexiaFont: 'a11y-dyslexia-font',
      readingGuide: 'a11y-reading-guide',
      bigCursor: 'a11y-big-cursor',
      focusRing: 'a11y-focus-ring',
      reduceMotion: 'a11y-reduce-motion'
    };
    var cls = classMap[key];
    if (cls) root.classList.toggle(cls, !!val);
    if (key === 'dyslexiaFont' && val) loadDyslexiaFont();
    if (key === 'readingGuide') toggleReadingGuide(!!val);
    savePrefs();
  }

  function pauseAllMedia() {
    Array.prototype.forEach.call(document.querySelectorAll('video, audio'), function (el) {
      try { el.pause(); } catch (e) {}
    });
  }

  function resetAll() {
    prefs = {};
    for (var k in defaults) prefs[k] = defaults[k];
    prefs.reduceMotion = prefersReducedMotionDefault();
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    applyAllToUI();
    applyTheme(prefs.theme);
    setTextSize(prefs.textSize);
    setLineSpacing(prefs.lineSpacing);
    ['highlightLinks', 'dyslexiaFont', 'readingGuide', 'bigCursor', 'focusRing', 'reduceMotion'].forEach(function (k) {
      setBoolPref(k, prefs[k]);
    });
  }

  // ---------- dyslexia font (loaded on demand) ----------
  var dyslexiaFontLoaded = false;
  function loadDyslexiaFont() {
    if (dyslexiaFontLoaded) return;
    dyslexiaFontLoaded = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap';
    document.head.appendChild(link);
  }

  // ---------- reading guide ----------
  var readingGuideBar = null;
  function toggleReadingGuide(on) {
    if (on) {
      if (!readingGuideBar) {
        readingGuideBar = document.createElement('div');
        readingGuideBar.id = 'a11y-reading-guide-bar';
        readingGuideBar.setAttribute('aria-hidden', 'true');
        readingGuideBar.style.top = '160px';
        document.body.appendChild(readingGuideBar);
        document.addEventListener('mousemove', onGuideMouseMove);
        document.addEventListener('keydown', onGuideKeydown);
      }
      readingGuideBar.hidden = false;
    } else if (readingGuideBar) {
      readingGuideBar.hidden = true;
    }
  }
  function onGuideMouseMove(e) {
    if (!readingGuideBar || readingGuideBar.hidden) return;
    readingGuideBar.style.top = (e.clientY - 22) + 'px';
  }
  function onGuideKeydown(e) {
    if (!readingGuideBar || readingGuideBar.hidden) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    var current = parseInt(readingGuideBar.style.top || '160', 10) || 160;
    var next = e.key === 'ArrowUp' ? current - 24 : current + 24;
    readingGuideBar.style.top = Math.max(0, next) + 'px';
    e.preventDefault();
  }

  // ---------- init / sync UI ----------
  function prefersReducedMotionDefault() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function updateMenuThemeRadiosUI() {
    var group = document.getElementById('a11y-theme-group');
    if (!group) return;
    Array.prototype.forEach.call(group.querySelectorAll('input'), function (r) {
      r.checked = (r.value === prefs.theme);
    });
  }

  function applyAllToUI() {
    var textVal = document.getElementById('a11y-text-value');
    if (textVal) textVal.textContent = prefs.textSize + '%';

    var lineGroup = document.getElementById('a11y-line-group');
    if (lineGroup) {
      Array.prototype.forEach.call(lineGroup.querySelectorAll('input'), function (r) {
        r.checked = (r.value === prefs.lineSpacing);
      });
    }
    updateMenuThemeRadiosUI();

    ['highlightLinks', 'dyslexiaFont', 'readingGuide', 'bigCursor', 'focusRing', 'reduceMotion'].forEach(function (k) {
      var cb = document.getElementById('a11y-cb-' + k);
      if (cb) cb.checked = !!prefs[k];
    });
  }

  function init() {
    if (prefs.reduceMotion === null) prefs.reduceMotion = prefersReducedMotionDefault();

    var landmarks = ensureLandmarks();
    addSkipLinks(landmarks);
    mountThemeToggle();
    mountAccessibilityMenu(landmarks);

    applyAllToUI();
    applyTheme(prefs.theme);
    setTextSize(prefs.textSize);
    setLineSpacing(prefs.lineSpacing);
    if (prefs.dyslexiaFont) loadDyslexiaFont();
    root.classList.toggle('a11y-highlight-links', !!prefs.highlightLinks);
    root.classList.toggle('a11y-dyslexia-font', !!prefs.dyslexiaFont);
    root.classList.toggle('a11y-big-cursor', !!prefs.bigCursor);
    root.classList.toggle('a11y-focus-ring', !!prefs.focusRing);
    root.classList.toggle('a11y-reduce-motion', !!prefs.reduceMotion);
    toggleReadingGuide(!!prefs.readingGuide);
    savePrefs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
