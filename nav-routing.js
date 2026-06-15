/* ============================================================
   Working-tab nav routing — single source of truth for both
   Luna and Midship sidebars across all 13 remaining option pages.

   Post-cull state: only wedges + substrate + #6 (pending eval)
   remain. Eight bundle-only options were archived; their entries
   are removed from the IA + fallback maps.
   ============================================================ */

(function () {
  // ---- Luna IA — flat 7-item nav matching the reference ----
  var LUNA_IA = [
    { key: 'controls',         label: 'Controls',         icon: 'shield',    href: 'option-6-evidence-score.html' },
    { key: 'walkthroughs',     label: 'Walkthroughs',     icon: 'route',     href: 'option-13-tumor-board.html' },
    { key: 'templates',        label: 'Templates',        icon: 'grid',      href: 'option-5-assertion-tracer.html' },
    { key: 'workspace-docs',   label: 'Workspace Docs',   icon: 'book',      href: 'option-1-clusters.html' },
    { key: 'docs',             label: 'Docs',             icon: 'file-text', href: 'option-12-prospectus.html' },
    { key: 'background-tasks', label: 'Background Tasks', icon: 'activity',  href: 'option-17-drift.html' },
    { key: 'users',            label: 'Users',            icon: 'users',     href: 'option-16-referee.html' }
  ];

  // Parent fallback — for the remaining options not in the top-level list.
  var OPTION_TO_LUNA_PARENT = {
    'option-2-auto.html':            'workspace-docs',
    'option-4-differential.html':    'workspace-docs',
    'option-7-black-box.html':       'background-tasks',
    'option-15-stress-test.html':    'walkthroughs',
    'option-18-surveillance.html':   'background-tasks',
    'option-19-oracle.html':         'background-tasks'
  };

  // ---- Midship IA — keeps the actual product nav labels ----
  var MIDSHIP_IA = [
    { key: 'controls',         label: 'Controls',         icon: 'ico-controls',         href: 'option-6-evidence-score.html' },
    { key: 'approvals',        label: 'Approvals',        icon: 'ico-approvals',        href: 'option-12-prospectus.html' },
    { key: 'templates',        label: 'Templates',        icon: 'ico-templates',        href: 'option-5-assertion-tracer.html' },
    { key: 'workspace-docs',   label: 'Workspace Docs',   icon: 'ico-workspace-docs',   href: 'option-1-clusters.html' },
    { key: 'libraries',        label: 'Libraries',        icon: 'ico-libraries',        href: 'option-7-black-box.html' },
    { key: 'docs',             label: 'Docs',             icon: 'ico-docs',             href: 'option-5-assertion-tracer.html' },
    { key: 'background-tasks', label: 'Background Tasks', icon: 'ico-tasks',            href: 'option-17-drift.html' },
    { key: 'users-top',        label: 'Users',            icon: 'ico-users',            href: 'option-16-referee.html' },
    { key: 'admin',            label: 'Admin',            icon: 'ico-admin',            href: 'option-19-oracle.html', sub: [
      { key: 'admin-roles',         label: 'Roles',         icon: 'ico-roles',         href: 'option-13-tumor-board.html' },
      { key: 'admin-settings',      label: 'Settings',      icon: 'ico-settings',      href: 'option-19-oracle.html' }
    ]}
  ];

  var OPTION_TO_MIDSHIP_PARENT = {
    'option-2-auto.html':         'workspace-docs',
    'option-4-differential.html': 'workspace-docs',
    'option-15-stress-test.html': 'approvals',
    'option-18-surveillance.html':'background-tasks'
  };

  // ---- Lucide-style SVG icon set for Luna sidebar ----
  var ICONS = {
    shield:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    route:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>',
    grid:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    book:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'file-text':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
    activity:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    users:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  };

  function currentFile() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p.replace(/[?#].*$/, '');
  }

  function lunaActiveKey() {
    var here = currentFile();
    for (var i = 0; i < LUNA_IA.length; i++) {
      if (LUNA_IA[i].href === here) return LUNA_IA[i].key;
    }
    return OPTION_TO_LUNA_PARENT[here] || null;
  }

  function buildLunaNav() {
    var activeKey = lunaActiveKey();
    return LUNA_IA.map(function (node) {
      var active = node.key === activeKey ? ' class="active"' : '';
      var icon = ICONS[node.icon] || '';
      return '<a href="' + node.href + '"' + active + '>'
        +   '<span class="nav-icon">' + icon + '</span>'
        +   '<span>' + node.label + '</span>'
        + '</a>';
    }).join('');
  }

  function injectCustomerPill(sidebar) {
    if (!sidebar) return;
    if (sidebar.querySelector('.luna-customer-pill')) return;
    var brand = sidebar.querySelector('.brand');
    if (!brand) return;
    var pill = document.createElement('div');
    pill.className = 'luna-customer-pill';
    pill.textContent = 'Helios Robotics';
    brand.insertAdjacentElement('afterend', pill);
  }

  function applyLunaNav() {
    var sidebar = document.querySelector('.app-sidebar');
    if (!sidebar) return;
    var nav = sidebar.querySelector('nav');
    if (nav) nav.innerHTML = buildLunaNav();
    injectCustomerPill(sidebar);
  }

  function midshipActiveKey() {
    var here = currentFile();
    for (var i = 0; i < MIDSHIP_IA.length; i++) {
      if (MIDSHIP_IA[i].href === here) return MIDSHIP_IA[i].key;
      if (MIDSHIP_IA[i].sub) {
        for (var j = 0; j < MIDSHIP_IA[i].sub.length; j++) {
          if (MIDSHIP_IA[i].sub[j].href === here) return MIDSHIP_IA[i].sub[j].key;
        }
      }
    }
    return OPTION_TO_MIDSHIP_PARENT[here] || null;
  }

  window.SufficiencyIA = {
    luna: LUNA_IA,
    midship: MIDSHIP_IA,
    currentFile: currentFile,
    lunaActiveKey: lunaActiveKey,
    midshipActiveKey: midshipActiveKey,
    applyLunaNav: applyLunaNav
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLunaNav);
  } else {
    applyLunaNav();
  }
})();
