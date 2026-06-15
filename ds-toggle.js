/* ============================================================
   Design-system toggle (Optro Luna ↔ Midship).
   On every option page:
     1. Reads the Luna sidebar's active nav text to derive an
        active key for the Midship nav.
     2. Injects the Midship sidebar matching the actual product —
        white background, orange logo + "by Optro" co-brand,
        customer pill, vertical nav with icons + labels, outlined
        active state, sub-items under Libraries and Admin,
        email + Logout footer.
     3. Injects a floating Midship orb in the bottom-right corner.
     4. Injects a segmented DS-toggle pill into the topbar.
     5. Restores the user's last DS choice from localStorage.
     6. Toggling sets body[data-ds] and persists the choice.

   CSS in chrome-midship.css controls which chrome is visible.
   ============================================================ */

(function () {
  var KEY = 'sufficiency-ds';

  // Pull the shared IA from nav-routing.js (loaded before this script).
  function getIA() {
    return (window.SufficiencyIA && window.SufficiencyIA.midship) || [];
  }
  function getActiveKey() {
    if (window.SufficiencyIA && window.SufficiencyIA.midshipActiveKey) {
      return window.SufficiencyIA.midshipActiveKey() || 'workspace-docs';
    }
    return 'workspace-docs';
  }

  function buildNav(activeKey) {
    var IA = getIA();
    var html = '';
    IA.forEach(function (item) {
      var isActive = item.key === activeKey;
      var href = item.href || '#';
      html += '<a href="' + href + '" class="midship-nav-item' + (isActive ? ' active' : '') + '" data-key="' + item.key + '">'
           +   '<span class="midship-nav-icon ' + item.icon + '"></span>'
           +   '<span>' + item.label + '</span>'
           + '</a>';
      if (item.sub) {
        html += '<div class="midship-nav-subitems">';
        item.sub.forEach(function (s) {
          var isSubActive = s.key === activeKey;
          var subHref = s.href || '#';
          html += '<a href="' + subHref + '" class="midship-nav-subitem' + (isSubActive ? ' active' : '') + '" data-key="' + s.key + '">'
               +   '<span class="midship-nav-icon ' + s.icon + '"></span>'
               +   '<span>' + s.label + '</span>'
               + '</a>';
        });
        html += '</div>';
      }
    });
    return html;
  }

  function buildSidebar(activeKey) {
    return ''
      + '<aside class="midship-sidebar">'
      +   '<div class="midship-brand">'
      +     '<div class="midship-logo" aria-hidden="true"></div>'
      +     '<div class="midship-brand-text">'
      +       '<div class="midship-brand-name">Midship</div>'
      +       '<div class="midship-brand-cobrand">by <span class="optro-mark-mini" aria-label="Optro"></span></div>'
      +     '</div>'
      +     '<button class="midship-collapse" type="button" aria-label="Collapse sidebar">‹</button>'
      +   '</div>'
      +   '<div class="midship-customer-pill">Helios Robotics</div>'
      +   '<nav class="midship-nav">' + buildNav(activeKey) + '</nav>'
      +   '<div class="midship-footer">'
      +     '<div class="midship-user-email">sarah.kim@helios.com</div>'
      +     '<a class="midship-logout" href="#"><span class="midship-nav-icon ico-logout"></span>Logout</a>'
      +   '</div>'
      + '</aside>';
  }

  function injectMidshipSidebar() {
    var app = document.querySelector('.app');
    if (!app) return;
    if (app.querySelector('.midship-sidebar')) return;
    var html = buildSidebar(getActiveKey());
    var lunaSidebar = app.querySelector('.app-sidebar');
    if (lunaSidebar) lunaSidebar.insertAdjacentHTML('afterend', html);
    else app.insertAdjacentHTML('afterbegin', html);

    // Wire collapse toggle
    var sidebar = app.querySelector('.midship-sidebar');
    var btn = sidebar.querySelector('.midship-collapse');
    if (btn) {
      btn.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        btn.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
      });
    }
  }

  function injectMidshipOrb() {
    if (document.querySelector('.midship-orb')) return;
    var orb = document.createElement('div');
    orb.className = 'midship-orb';
    orb.setAttribute('role', 'button');
    orb.setAttribute('aria-label', 'Open assistant');
    orb.title = 'Midship assistant';
    document.body.appendChild(orb);
  }

  function buildToggle() {
    return ''
      + '<div class="ds-toggle" role="radiogroup" aria-label="Design system">'
      +   '<button class="ds-toggle-option" data-ds-value="luna" role="radio" aria-checked="false" type="button">'
      +     '<span class="ds-toggle-swatch" aria-hidden="true"></span>'
      +     '<span>Luna</span>'
      +   '</button>'
      +   '<button class="ds-toggle-option" data-ds-value="midship" role="radio" aria-checked="false" type="button">'
      +     '<span class="ds-toggle-swatch" aria-hidden="true"></span>'
      +     '<span>Midship</span>'
      +   '</button>'
      + '</div>';
  }

  function injectToggle() {
    var topbar = document.querySelector('.app-topbar');
    if (!topbar) return;
    if (topbar.querySelector('.ds-toggle')) return;
    var html = buildToggle();
    var avatar = topbar.querySelector('.avatar');
    if (avatar) avatar.insertAdjacentHTML('beforebegin', html);
    else topbar.insertAdjacentHTML('beforeend', html);
  }

  function applyDS(ds) {
    document.body.setAttribute('data-ds', ds);
    document.querySelectorAll('.ds-toggle .ds-toggle-option').forEach(function (btn) {
      var on = btn.dataset.dsValue === ds;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    try { localStorage.setItem(KEY, ds); } catch (e) {}
  }

  function wireToggle() {
    document.querySelectorAll('.ds-toggle .ds-toggle-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyDS(btn.dataset.dsValue);
      });
    });
  }

  function init() {
    if (!document.querySelector('.app')) return;
    injectMidshipSidebar();
    injectMidshipOrb();
    injectToggle();
    wireToggle();
    var saved = 'luna';
    try { saved = localStorage.getItem(KEY) || 'luna'; } catch (e) {}
    if (saved !== 'midship' && saved !== 'luna') saved = 'luna';
    applyDS(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
