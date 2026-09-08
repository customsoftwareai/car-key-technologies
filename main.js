// Car Key Technologies — shared site behavior

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Contact page form tabs (Request Service / Become a Partner)
  var tabBtns = document.querySelectorAll('.form-tab-btn');
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panelId = btn.getAttribute('aria-controls');
        document.querySelectorAll('.form-tab-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.form-tab-panel').forEach(function (p) {
          p.classList.remove('active');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        var panel = document.getElementById(panelId);
        if (panel) { panel.classList.add('active'); }
      });
    });
    // Deep link support: contact.html#partner opens the partner application tab
    if (window.location.hash === '#partner') {
      var partnerBtn = document.getElementById('tab-btn-partner');
      if (partnerBtn) { partnerBtn.click(); }
    }
  }
});
