/* ============================================================
   sources-strip.js
   ----------------------------------------------------------------
   Shared sources-strip runtime — injected on every option page.

   On DOMContentLoaded:
     1. Find .app-body. If absent → no-op (landing page).
     2. Prepend a persistent <div class="sources-strip"> with
        source-type chips (API / Agent / Upload / Scheduled /
        Email / Slack) plus two CTAs (Connect a source, Upload).
     3. Wire chip + CTA clicks to open in-page modals:
          - Connect modal: integration catalog by category, opens
            a 4-step setup pane on the right when a card is clicked.
          - Upload modal: drag-zone + recent uploads + control map.

   Idempotent: only injects once per page, guarded by a data
   attribute on the strip. Mirrors provenance.js injection style.
   ============================================================ */

(function () {
  'use strict';

  var SOURCES_PAGE = 'option-12-prospectus.html';

  // ----- Data: source-type chips ---------------------------------

  var CHIPS = [
    { key: 'api',       icon: '🔌', label: 'API',       count: '1,847', sub: '5 systems · 8 min ago',     category: 'ERP' },
    { key: 'agent',     icon: '🤖', label: 'Agent',     count: '587',   sub: 'sufficiency-agent-v2',      category: 'Agent' },
    { key: 'upload',    icon: '📤', label: 'Upload',    count: '412',   sub: '89 uploaders',              category: null /* opens Upload modal */ },
    { key: 'scheduled', icon: '⏰', label: 'Scheduled', count: '196',   sub: '8 DAGs',                    category: 'Data warehouse' },
    { key: 'email',     icon: '📧', label: 'Email',     count: '41',    sub: 'controls@helios.com',       category: 'Comms' },
    { key: 'slack',     icon: '💬', label: 'Slack',     count: '11',    sub: '#sox-evidence',             category: 'Comms' }
  ];

  // ----- Data: integration catalog (≥18) -------------------------

  var INTEGRATIONS = [
    { id: 'netsuite',  name: 'NetSuite',           cat: 'ERP',            initials: 'NS',  color: '#2E7D32', status: 'connected', evidence: 642, sync: 'synced 8m ago' },
    { id: 'workday',   name: 'Workday',            cat: 'HRIS',           initials: 'W',   color: '#0875E1', status: 'connected', evidence: 138, sync: 'synced 22m ago' },
    { id: 'adp',       name: 'ADP',                cat: 'HRIS',           initials: 'A',   color: '#D8232A', status: 'available' },
    { id: 'okta',      name: 'Okta',               cat: 'IAM',            initials: 'OK',  color: '#007DC1', status: 'connected', evidence: 412, sync: 'synced 4m ago' },
    { id: 'entra',     name: 'Microsoft Entra ID', cat: 'IAM',            initials: 'ME',  color: '#0078D4', status: 'connected', evidence: 287, sync: 'synced 11m ago' },
    { id: 'aws-iam',   name: 'AWS IAM',            cat: 'IAM',            initials: 'AW',  color: '#FF9900', status: 'connected', evidence: 287, sync: 'synced 6m ago' },
    { id: 'salesforce',name: 'Salesforce',         cat: 'CRM',            initials: 'SF',  color: '#00A1E0', status: 'connected', evidence: 261, sync: 'synced 14m ago' },
    { id: 'hubspot',   name: 'HubSpot',            cat: 'CRM',            initials: 'HS',  color: '#FF7A59', status: 'available' },
    { id: 'snowflake', name: 'Snowflake',          cat: 'Data warehouse', initials: 'SN',  color: '#29B5E8', status: 'connected', evidence: 245, sync: 'degraded · last 47m ago', degraded: true },
    { id: 'databricks',name: 'Databricks',         cat: 'Data warehouse', initials: 'DB',  color: '#FF3621', status: 'available' },
    { id: 'bigquery',  name: 'BigQuery',           cat: 'Data warehouse', initials: 'BQ',  color: '#4285F4', status: 'available' },
    { id: 'coupa',     name: 'Coupa',              cat: 'ERP',            initials: 'CP',  color: '#0072CE', status: 'beta' },
    { id: 'concur',    name: 'Concur',             cat: 'ERP',            initials: 'CN',  color: '#0F4880', status: 'available' },
    { id: 'jira',      name: 'Jira',               cat: 'Ticketing',      initials: 'JR',  color: '#2684FF', status: 'available' },
    { id: 'servicenow',name: 'ServiceNow',         cat: 'Ticketing',      initials: 'SN',  color: '#62D84E', status: 'connected', evidence: 108, sync: 'synced 18m ago' },
    { id: 'github',    name: 'GitHub',             cat: 'Cloud',          initials: 'GH',  color: '#24292E', status: 'connected', evidence: 53,  sync: 'synced 12m ago' },
    { id: 'slack',     name: 'Slack admin',        cat: 'Comms',          initials: 'SL',  color: '#4A154B', status: 'connected', evidence: 11,  sync: 'webhook live' },
    { id: 'gworkspace',name: 'Google Workspace',   cat: 'Comms',          initials: 'GW',  color: '#4285F4', status: 'connected', evidence: 27,  sync: 'synced 9m ago' },
    { id: 'm365',      name: 'Microsoft 365',      cat: 'Comms',          initials: 'M3',  color: '#D83B01', status: 'connected', evidence: 42,  sync: 'synced 7m ago' },
    { id: 'docusign',  name: 'DocuSign',           cat: 'Files',          initials: 'DS',  color: '#FFCC22', status: 'beta' },
    { id: 'carta',     name: 'Carta',              cat: 'Files',          initials: 'CR',  color: '#FA4B33', status: 'beta' },
    { id: 'netdocs',   name: 'NetDocuments',       cat: 'Files',          initials: 'ND',  color: '#1A3E72', status: 'available' }
  ];

  var CATEGORIES = [
    'All', 'ERP', 'HRIS', 'IAM', 'CRM', 'Data warehouse', 'Ticketing', 'Cloud', 'Comms', 'Files'
  ];

  // ----- Data: recent uploads ------------------------------------

  var RECENT_UPLOADS = [
    { file: 'NS-UAR-Q3-2026-final.xlsx',           ctrl: 'CTL-UAR-04',   by: 'Marcus Chen',     when: '14 min ago' },
    { file: 'Payroll-recon-Sep-2026.pdf',          ctrl: 'CTL-PAY-12',   by: 'Astrid Levin',    when: '1 hr ago' },
    { file: 'Wire-approvals-2026-09.pdf',          ctrl: 'CTL-TRE-04',   by: 'Brigitte Marsh',  when: '2 hr ago' },
    { file: 'Board-minutes-2026-Q3.docx',          ctrl: 'CTL-ENT-03',   by: 'Helena Kowalski', when: '4 hr ago' },
    { file: 'Inventory-count-variance-Aug.xlsx',   ctrl: 'CTL-INV-03',   by: 'Daniel Park',     when: 'Yesterday' },
    { file: 'JE-rationale-pkg-2026-09.pdf',        ctrl: 'CTL-FR-02',    by: 'Sienna Whitfield',when: 'Yesterday' }
  ];

  // ----- helpers -------------------------------------------------

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'data') {
          Object.keys(attrs.data).forEach(function (d) { node.dataset[d] = attrs.data[d]; });
        } else node.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) node.innerHTML = html;
    return node;
  }

  // ----- The strip ------------------------------------------------

  function buildStrip() {
    var chipsHTML = CHIPS.map(function (c) {
      return ''
        + '<button class="ss-chip" type="button" data-source-key="' + esc(c.key) + '">'
        +   '<span class="ss-chip-icon" aria-hidden="true">' + c.icon + '</span>'
        +   '<span class="ss-chip-label">' + esc(c.label) + '</span>'
        +   '<span class="ss-chip-count tabular">' + esc(c.count) + '</span>'
        +   '<span class="ss-chip-sub">' + esc(c.sub) + '</span>'
        + '</button>';
    }).join('');

    return ''
      + '<div class="sources-strip" data-injected="sources-strip">'
      +   '<div class="ss-left">'
      +     '<div class="ss-eyebrow">Sources this cycle</div>'
      +     '<div class="ss-chips">' + chipsHTML + '</div>'
      +   '</div>'
      +   '<div class="ss-right">'
      +     '<a class="ss-view-all" href="' + SOURCES_PAGE + '">View full intake →</a>'
      +     '<button class="btn sm" type="button" data-ss-action="upload">📤 Upload evidence</button>'
      +     '<button class="btn sm primary" type="button" data-ss-action="connect">+ Connect a source</button>'
      +   '</div>'
      + '</div>';
  }

  function injectStrip() {
    // Per-page opt-out: <body data-sources-strip="off"> suppresses injection
    // entirely (used by minimalist redesigns where the table is primary).
    if (document.body && document.body.dataset.sourcesStrip === 'off') return true;

    var body = document.querySelector('.app-body');
    if (!body) return false;
    if (body.querySelector('[data-injected="sources-strip"]')) return true;

    body.insertAdjacentHTML('afterbegin', buildStrip());

    var strip = body.querySelector('[data-injected="sources-strip"]');
    wireStrip(strip);
    return true;
  }

  function wireStrip(strip) {
    if (!strip) return;
    strip.addEventListener('click', function (e) {
      var chip = e.target.closest('.ss-chip');
      if (chip) {
        openConnectModal(chip.dataset.sourceKey);
        return;
      }
      var btn = e.target.closest('[data-ss-action]');
      if (!btn) return;
      var action = btn.dataset.ssAction;
      if (action === 'connect') openConnectModal();
      if (action === 'upload')  openUploadModal();
    });
  }

  // ----- Connect modal --------------------------------------------

  var connectModal = null;
  var uploadModal = null;
  var backdrop = null;
  var activeModal = null;
  var lastFocus = null;

  function ensureBackdrop() {
    if (backdrop) return backdrop;
    backdrop = el('div', { class: 'ss-modal-backdrop', 'data-injected': 'ss-backdrop' });
    backdrop.addEventListener('click', closeActiveModal);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function statusPill(status, degraded) {
    if (status === 'connected') {
      if (degraded) return '<span class="ss-pill degraded">Degraded</span>';
      return '<span class="ss-pill connected">Connected ✓</span>';
    }
    if (status === 'beta')      return '<span class="ss-pill beta">Beta</span>';
    return '<span class="ss-pill available">Available</span>';
  }

  function cardHTML(it) {
    var connected = it.status === 'connected';
    var ctaText = connected ? 'Configure' : (it.status === 'beta' ? 'Request access' : 'Connect');
    var ctaClass = connected ? '' : 'primary';
    var classes = ['ss-card'];
    if (connected) classes.push('connected');
    if (it.status === 'beta') classes.push('beta');

    var evidenceBlock = connected
      ? '<div class="ss-card-meta">'
        +   '<div>'
        +     '<div class="ss-card-evidence">' + esc(String(it.evidence)) + '</div>'
        +     '<div class="ss-card-evidence-label">evidences</div>'
        +   '</div>'
        +   '<div class="ss-card-sync">' + esc(it.sync || '') + '</div>'
        + '</div>'
      : '<div class="ss-card-meta">'
        +   '<div class="ss-card-evidence-label">Not connected</div>'
        + '</div>';

    return ''
      + '<div class="' + classes.join(' ') + '" data-int-id="' + esc(it.id) + '">'
      +   '<div class="ss-card-head">'
      +     '<div class="ss-card-logo" style="background:' + esc(it.color) + '">' + esc(it.initials) + '</div>'
      +     '<div class="ss-card-name-block">'
      +       '<div class="ss-card-name">' + esc(it.name) + '</div>'
      +       '<div class="ss-card-cat">' + esc(it.cat) + '</div>'
      +     '</div>'
      +     statusPill(it.status, it.degraded)
      +   '</div>'
      +   evidenceBlock
      +   '<button class="ss-card-cta ' + ctaClass + '" type="button" data-action="setup" data-int-id="' + esc(it.id) + '">' + ctaText + '</button>'
      + '</div>';
  }

  function buildConnectModal() {
    if (connectModal) return connectModal;

    var catsHTML = CATEGORIES.map(function (cat) {
      var count = (cat === 'All') ? INTEGRATIONS.length : INTEGRATIONS.filter(function (i) { return i.cat === cat; }).length;
      var active = cat === 'All' ? ' active' : '';
      return ''
        + '<button class="ss-cat' + active + '" type="button" data-cat="' + esc(cat) + '">'
        +   '<span>' + esc(cat) + '</span>'
        +   '<span class="ss-cat-count">' + count + '</span>'
        + '</button>';
    }).join('');

    var gridHTML = INTEGRATIONS.map(cardHTML).join('');

    var modal = el('div', {
      class: 'ss-modal connect',
      'data-injected': 'ss-modal-connect',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'ss-connect-title'
    }, ''
      + '<div class="ss-modal-head">'
      +   '<div>'
      +     '<h2 class="ss-modal-title" id="ss-connect-title">Connect a data source</h2>'
      +     '<div class="ss-modal-sub">22 integrations · 13 connected · 412 evidences flowing this cycle</div>'
      +   '</div>'
      +   '<button class="ss-modal-close" type="button" aria-label="Close">×</button>'
      + '</div>'
      + '<div class="ss-modal-body">'
      +   '<div class="ss-cat-rail" role="tablist">' + catsHTML + '</div>'
      +   '<div class="ss-modal-pane">'
      +     '<div class="ss-grid">' + gridHTML + '</div>'
      +   '</div>'
      +   buildSetupPaneHTML()
      + '</div>'
      + '<div class="ss-modal-foot">'
      +   '<span>Don\'t see what you need? Most ERP / IAM / data systems can be wired through the universal adapter.</span>'
      +   '<a href="' + SOURCES_PAGE + '#integrations">Browse all 22 integrations →</a>'
      + '</div>'
    );

    document.body.appendChild(modal);
    connectModal = modal;
    wireConnectModal(modal);
    return modal;
  }

  function buildSetupPaneHTML() {
    return ''
      + '<div class="ss-setup" data-setup-pane="1">'
      +   '<div class="ss-setup-head">'
      +     '<button class="ss-setup-back" type="button" aria-label="Back">←</button>'
      +     '<h3 class="ss-setup-title">Set up integration</h3>'
      +   '</div>'
      +   '<div class="ss-setup-body">'
      +     '<div class="ss-stepper">'
      +       '<div class="ss-step active"><span class="ss-step-dot">1</span> Auth</div>'
      +       '<div class="ss-step-line"></div>'
      +       '<div class="ss-step"><span class="ss-step-dot">2</span> Fields</div>'
      +       '<div class="ss-step-line"></div>'
      +       '<div class="ss-step"><span class="ss-step-dot">3</span> Schedule</div>'
      +       '<div class="ss-step-line"></div>'
      +       '<div class="ss-step"><span class="ss-step-dot">4</span> Map to controls</div>'
      +     '</div>'
      +     '<div class="ss-setup-section">'
      +       '<h4>Step 1 · Authenticate</h4>'
      +       '<p>OAuth handshake with the vendor. We never store passwords — only refresh tokens scoped to read-only endpoints. Confirm the audit-trail scope before continuing.</p>'
      +     '</div>'
      +     '<div class="ss-setup-section">'
      +       '<h4>Step 2 · Choose fields</h4>'
      +       '<p>Pick the entities and columns to pull each cycle. Defaults are pre-seeded from the SOX scoping doc for Helios Robotics Q3 2026.</p>'
      +     '</div>'
      +     '<div class="ss-setup-section">'
      +       '<h4>Step 3 · Schedule</h4>'
      +       '<p>Hourly, daily, or quarterly. Optional manual triggers from the row drawer.</p>'
      +     '</div>'
      +     '<div class="ss-setup-section">'
      +       '<h4>Step 4 · Map to controls</h4>'
      +       '<p>Each field maps to one or more controls in the Q3 plan. Mapping rules feed the sufficiency-agent so it knows what evidence is satisfied.</p>'
      +     '</div>'
      +   '</div>'
      +   '<div class="ss-setup-foot">'
      +     '<button class="btn" type="button" data-action="cancel-setup">Cancel</button>'
      +     '<a class="btn primary" href="' + SOURCES_PAGE + '#integrations">Continue in full setup →</a>'
      +   '</div>'
      + '</div>';
  }

  function wireConnectModal(modal) {
    // Close
    modal.querySelector('.ss-modal-close').addEventListener('click', closeActiveModal);

    // Category rail
    modal.querySelector('.ss-cat-rail').addEventListener('click', function (e) {
      var cat = e.target.closest('.ss-cat');
      if (!cat) return;
      filterByCategory(cat.dataset.cat);
    });

    // Cards
    modal.querySelector('.ss-grid').addEventListener('click', function (e) {
      var card = e.target.closest('.ss-card');
      if (!card) return;
      openSetupPane(card.dataset.intId);
    });

    // Setup pane back/cancel
    var setup = modal.querySelector('.ss-setup');
    setup.querySelector('.ss-setup-back').addEventListener('click', closeSetupPane);
    setup.querySelector('[data-action="cancel-setup"]').addEventListener('click', closeSetupPane);
  }

  function filterByCategory(cat) {
    if (!connectModal) return;
    connectModal.querySelectorAll('.ss-cat').forEach(function (c) {
      c.classList.toggle('active', c.dataset.cat === cat);
    });
    var cards = connectModal.querySelectorAll('.ss-card');
    cards.forEach(function (card) {
      var id = card.dataset.intId;
      var integration = INTEGRATIONS.find(function (i) { return i.id === id; });
      var show = (cat === 'All') || (integration && integration.cat === cat);
      card.style.display = show ? '' : 'none';
    });
  }

  function openSetupPane(intId) {
    if (!connectModal) return;
    var integration = INTEGRATIONS.find(function (i) { return i.id === intId; });
    var setup = connectModal.querySelector('.ss-setup');
    if (integration) {
      setup.querySelector('.ss-setup-title').textContent = 'Set up · ' + integration.name;
    }
    setup.classList.add('open');
  }

  function closeSetupPane() {
    if (!connectModal) return;
    var setup = connectModal.querySelector('.ss-setup');
    setup.classList.remove('open');
  }

  // ----- Upload modal --------------------------------------------

  function buildUploadModal() {
    if (uploadModal) return uploadModal;

    var recentHTML = RECENT_UPLOADS.map(function (u) {
      return ''
        + '<li>'
        +   '<div>'
        +     '<div class="ss-rec-file">' + esc(u.file) + '</div>'
        +     '<div class="ss-rec-sub">by ' + esc(u.by) + '</div>'
        +   '</div>'
        +   '<span class="ss-rec-control">' + esc(u.ctrl) + '</span>'
        +   '<span class="ss-rec-time">' + esc(u.when) + '</span>'
        + '</li>';
    }).join('');

    var modal = el('div', {
      class: 'ss-modal upload',
      'data-injected': 'ss-modal-upload',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'ss-upload-title'
    }, ''
      + '<div class="ss-modal-head">'
      +   '<div>'
      +     '<h2 class="ss-modal-title" id="ss-upload-title">Upload evidence</h2>'
      +     '<div class="ss-modal-sub">412 manual uploads this cycle · routed to controls automatically</div>'
      +   '</div>'
      +   '<button class="ss-modal-close" type="button" aria-label="Close">×</button>'
      + '</div>'
      + '<div class="ss-modal-body">'
      +   '<div class="ss-upload-pane">'
      +     '<div class="ss-upload-zone" tabindex="0">'
      +       '<div class="ss-uz-icon">📤</div>'
      +       '<div class="ss-uz-title">Drop files here or browse</div>'
      +       '<div class="ss-uz-sub">Files will be virus-scanned and OCR\'d before routing.</div>'
      +       '<button class="ss-uz-browse" type="button">Choose files</button>'
      +       '<div class="ss-uz-formats">Accepts <code>PDF</code> <code>XLSX</code> <code>CSV</code> <code>DOCX</code> <code>PNG</code> · max 50 MB</div>'
      +     '</div>'
      +     '<div class="ss-upload-section">'
      +       '<h4>Map upload to control</h4>'
      +       '<input class="ss-typeahead" type="text" placeholder="Search controls (e.g. CTL-UAR-04, three-way match, JE rationale)…" />'
      +     '</div>'
      +     '<div class="ss-upload-section">'
      +       '<h4>Recent uploads <a href="' + SOURCES_PAGE + '#uploads">View all 412 →</a></h4>'
      +       '<ul class="ss-recent-list">' + recentHTML + '</ul>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      + '<div class="ss-modal-foot">'
      +   '<span>Need to upload a batch? Use the SFTP drop point.</span>'
      +   '<a href="' + SOURCES_PAGE + '#uploads">Open full upload manager →</a>'
      + '</div>'
    );

    document.body.appendChild(modal);
    uploadModal = modal;
    wireUploadModal(modal);
    return modal;
  }

  function wireUploadModal(modal) {
    modal.querySelector('.ss-modal-close').addEventListener('click', closeActiveModal);
    var zone = modal.querySelector('.ss-upload-zone');
    var browse = modal.querySelector('.ss-uz-browse');
    if (browse) {
      browse.addEventListener('click', function (e) {
        e.stopPropagation();
        // No real file input — this is a smoke-and-mirrors prototype.
      });
    }
    if (zone) {
      ['dragenter', 'dragover'].forEach(function (evt) {
        zone.addEventListener(evt, function (e) {
          e.preventDefault();
          zone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(function (evt) {
        zone.addEventListener(evt, function (e) {
          e.preventDefault();
          zone.classList.remove('dragover');
        });
      });
    }
  }

  // ----- Modal open/close ----------------------------------------

  function openConnectModal(sourceKey) {
    ensureBackdrop();
    buildConnectModal();
    closeSetupPane();

    // If a chip was clicked, pick a sensible category to land on.
    var cat = 'All';
    if (sourceKey) {
      if (sourceKey === 'upload') {
        // Upload chip should open the upload modal instead.
        openUploadModal();
        return;
      }
      var match = CHIPS.find(function (c) { return c.key === sourceKey; });
      if (match && match.category) cat = match.category;
    }
    filterByCategory(cat);

    showModal(connectModal);
  }

  function openUploadModal() {
    ensureBackdrop();
    buildUploadModal();
    showModal(uploadModal);
  }

  function showModal(modal) {
    if (activeModal && activeModal !== modal) hideModal(activeModal);
    lastFocus = document.activeElement;
    backdrop.classList.add('open');
    modal.classList.add('open');
    document.body.classList.add('ss-modal-open');
    activeModal = modal;

    // Move focus into the modal.
    var first = modal.querySelector('.ss-modal-close');
    if (first) first.focus();
  }

  function hideModal(modal) {
    modal.classList.remove('open');
    if (modal === connectModal) closeSetupPane();
  }

  function closeActiveModal() {
    if (!activeModal) return;
    hideModal(activeModal);
    backdrop.classList.remove('open');
    document.body.classList.remove('ss-modal-open');
    activeModal = null;
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) { /* noop */ }
    }
  }

  // ----- a11y: Esc + focus trap ----------------------------------

  document.addEventListener('keydown', function (e) {
    if (!activeModal) return;
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeActiveModal();
      return;
    }
    if (e.key === 'Tab') {
      // Simple focus trap: keep focus within the active modal.
      var focusables = activeModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // ----- bootstrap -----------------------------------------------

  function boot() {
    var injected = injectStrip();
    if (injected) return;

    // .app-body may not exist yet (rare on these prototypes, but safe);
    // observe briefly so we still wire up if it appears.
    var mo = new MutationObserver(function () {
      if (injectStrip()) mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // Stop observing after a few seconds — landing page truly has no .app-body.
    setTimeout(function () { mo.disconnect(); }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
