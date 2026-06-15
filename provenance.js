/* Provenance + testing strip injector.
   Watches drawer body / row-detail / cell-drawer content for changes
   and injects two strips at top + bottom of the body:
     1. "How this arrived" — source type + system + chain of custody
     2. "Where this goes" — tests this evidence feeds + sample status

   Deterministic by drawer title (or fallback key) so the same drawer
   always shows the same lineage. No backend, no real data — illustrative
   only, but reads as plausible against the rest of the prototype.
*/

(function () {
  var SOURCES = [
    {
      kind: 'integration', icon: '🔌',
      system: 'NetSuite UAR Export',
      method: 'API pull',
      actor: 'job',
      actorName: 'daily-uar-sync',
      latency: '2.4s',
      chain: ['NetSuite API', 'S3', 'indexed']
    },
    {
      kind: 'integration', icon: '🔌',
      system: 'Okta Universal Directory',
      method: 'API pull',
      actor: 'job',
      actorName: 'hourly-okta-sync',
      latency: '1.1s',
      chain: ['Okta SCIM', 'parser', 'indexed']
    },
    {
      kind: 'integration', icon: '🔌',
      system: 'AWS IAM Snapshot',
      method: 'Scheduled snapshot',
      actor: 'job',
      actorName: 'aws-iam-snapshot',
      latency: '4.7s',
      chain: ['IAM API', 'S3', 'diff-vs-prior', 'indexed']
    },
    {
      kind: 'integration', icon: '🔌',
      system: 'Salesforce Approval Log',
      method: 'API pull',
      actor: 'job',
      actorName: 'sfdc-approval-pull',
      latency: '3.2s',
      chain: ['SF REST', 'parser', 'indexed']
    },
    {
      kind: 'integration', icon: '🔌',
      system: 'Snowflake Journal Entries > $250K',
      method: 'SQL query',
      actor: 'job',
      actorName: 'je-materiality-sweep',
      latency: '8.9s',
      chain: ['Snowflake', 'parser', 'indexed']
    },
    {
      kind: 'upload', icon: '📤',
      system: 'Browser upload',
      method: 'File upload',
      actor: 'person',
      actorName: 'Marcus Chen · IT Operations',
      latency: 'manual',
      chain: ['drag-drop', 'virus scan', 'OCR', 'indexed']
    },
    {
      kind: 'upload', icon: '📤',
      system: 'Browser upload',
      method: 'File upload',
      actor: 'person',
      actorName: 'Astrid Levin · Payroll',
      latency: 'manual',
      chain: ['drag-drop', 'virus scan', 'indexed']
    },
    {
      kind: 'upload', icon: '📤',
      system: 'Browser upload',
      method: 'File upload',
      actor: 'person',
      actorName: 'Brigitte Marsh · Treasury',
      latency: 'manual',
      chain: ['drag-drop', 'virus scan', 'indexed']
    },
    {
      kind: 'agent', icon: '🤖',
      system: 'sufficiency-agent-v2',
      method: 'Auto-collected',
      actor: 'agent',
      actorName: 'pulled on prior-insufficient retry',
      latency: '4.1s',
      chain: ['agent runner', 'tool calls', 'normalize', 'indexed']
    },
    {
      kind: 'agent', icon: '🤖',
      system: 'evidence-completion-agent',
      method: 'Auto-collected',
      actor: 'agent',
      actorName: 'triggered on missing-supporting-attachment',
      latency: '6.3s',
      chain: ['agent runner', 'source negotiate', 'fetch', 'indexed']
    },
    {
      kind: 'email', icon: '📧',
      system: 'controls@helios.com',
      method: 'Email forwarded',
      actor: 'inbox',
      actorName: 'parsed by email-pipeline',
      latency: '38s',
      chain: ['inbox webhook', 'parser', 'attachments out', 'indexed']
    },
    {
      kind: 'scheduled', icon: '⏰',
      system: 'cron / Airflow',
      method: 'Scheduled job',
      actor: 'scheduler',
      actorName: 'q3-uar-monthly',
      latency: '12.7s',
      chain: ['Airflow trigger', 'extract', 'transform', 'indexed']
    },
    {
      kind: 'slack', icon: '💬',
      system: '#sox-evidence channel',
      method: 'Slack capture',
      actor: 'bot',
      actorName: 'evidence-bot · pinned by D. Park',
      latency: '1.8s',
      chain: ['Slack event', 'attachment fetch', 'OCR', 'indexed']
    }
  ];

  var TESTS = [
    { id: 'TST-UAR-04',  attr: 'Approver ≠ preparer (SOD)',                 sampleN: '60 stratified',      method: '95% CI ±5%', status: 'tested',  date: '9/29' },
    { id: 'TST-UAR-02',  attr: 'All active users appear in review',         sampleN: 'full population',    method: 'census',     status: 'active',  date: null  },
    { id: 'TST-REV-07',  attr: 'Cutoff date ≤ 2026-09-30',                  sampleN: '40 random',          method: 'attribute',  status: 'queue',   date: null  },
    { id: 'TST-ITGC-03', attr: 'Quarterly cadence met',                     sampleN: 'full',               method: 'census',     status: 'tested',  date: '9/27' },
    { id: 'TST-PAY-12',  attr: 'Reconciliation $0 variance',                sampleN: '30 random',          method: 'monetary',   status: 'blocked', date: null  },
    { id: 'TST-PRC-09',  attr: 'Three-way match resolved',                  sampleN: '60 stratified',      method: '95% CI ±5%', status: 'tested',  date: '9/28' },
    { id: 'TST-TRE-04',  attr: 'Dual auth on wires > $50K',                 sampleN: '25 random',          method: 'attribute',  status: 'active',  date: null  },
    { id: 'TST-FR-02',   attr: 'JE > $250K has business rationale',         sampleN: '60 stratified',      method: '95% CI ±5%', status: 'queue',   date: null  },
    { id: 'TST-INV-03',  attr: 'Cycle count variance investigated',         sampleN: 'full',               method: 'census',     status: 'tested',  date: '9/26' },
    { id: 'TST-ENT-03',  attr: 'Quarterly board minutes attested',          sampleN: 'full',               method: 'census',     status: 'queue',   date: null  }
  ];

  function hashStr(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function pickSource(key) {
    return SOURCES[hashStr('s|' + key) % SOURCES.length];
  }
  function pickTests(key) {
    var n = 1 + (hashStr('n|' + key) % 2);  // 1 or 2 tests
    var start = hashStr('t|' + key) % TESTS.length;
    var picks = [];
    for (var i = 0; i < n; i++) picks.push(TESTS[(start + i) % TESTS.length]);
    return picks;
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function provStripHTML(source) {
    var chainHTML = source.chain
      .map(function (s, i) {
        return (i === 0 ? '' : '<span class="sep">›</span>')
          + '<span class="step">' + escapeHTML(s) + '</span>';
      }).join('');
    return ''
      + '<div class="prov-strip" data-injected="provenance">'
      +   '<div class="prov-icon" aria-hidden="true">' + source.icon + '</div>'
      +   '<div class="prov-meat">'
      +     '<div class="prov-label">How this arrived</div>'
      +     '<div class="prov-title">' + escapeHTML(source.system) + ' · ' + escapeHTML(source.method) + '</div>'
      +     '<div class="prov-sub">'
      +       '<span class="actor">' + escapeHTML(source.actorName) + '</span> · '
      +       'latency <code>' + escapeHTML(source.latency) + '</code>'
      +     '</div>'
      +     '<div class="prov-chain">' + chainHTML + '</div>'
      +   '</div>'
      + '</div>';
  }

  function statusLabel(status) {
    if (status === 'tested')  return { cls: 'tested',  text: 'Tested' };
    if (status === 'active')  return { cls: 'active',  text: 'In progress' };
    if (status === 'queue')   return { cls: 'queue',   text: 'Queued' };
    if (status === 'blocked') return { cls: 'blocked', text: 'Blocked' };
    return { cls: 'queue', text: status };
  }

  function testsStripHTML(tests) {
    var items = tests.map(function (t) {
      var s = statusLabel(t.status);
      var date = t.date ? ' · <span class="text-subdued">' + escapeHTML(t.date) + '</span>' : '';
      return '<li>'
        + '<span class="test-id">' + escapeHTML(t.id) + '</span>'
        + '<span class="test-attr">' + escapeHTML(t.attr) + ' <span class="text-subdued" style="font-size: 11px;">· sample ' + escapeHTML(String(t.sampleN)) + ' · ' + escapeHTML(t.method) + '</span></span>'
        + '<span class="test-status ' + s.cls + '">' + s.text + date + '</span>'
        + '</li>';
    }).join('');
    var sampleNote = tests.some(function (t) { return /stratified|random/.test(String(t.sampleN)); })
      ? '<div class="tests-sample"><b>Sample method:</b> stratified by domain · 95% CI ±5% per ASA 530.</div>'
      : '<div class="tests-sample"><b>Census:</b> every member of the population is tested directly.</div>';
    return ''
      + '<div class="tests-strip" data-injected="tests">'
      +   '<div class="tests-icon" aria-hidden="true">🔬</div>'
      +   '<div class="tests-meat">'
      +     '<div class="tests-label">Where this goes</div>'
      +     '<div class="tests-title">Feeds ' + tests.length + ' test' + (tests.length === 1 ? '' : 's') + ' in the Q3 plan</div>'
      +     '<ul class="tests-list">' + items + '</ul>'
      +     sampleNote
      +   '</div>'
      + '</div>';
  }

  function deriveKey(bodyEl) {
    // Prefer the drawer title, then breadcrumb, then row identifier, then a stable fallback.
    var titleEl = document.querySelector('.drawer .h-title, .drawer-head .h-title, .drawer h2');
    if (titleEl && titleEl.textContent.trim()) return titleEl.textContent.trim();
    var idAttr = bodyEl.id || bodyEl.getAttribute('data-key');
    if (idAttr) return idAttr;
    return location.pathname + ':default';
  }

  function injectInto(bodyEl) {
    if (!bodyEl) return;
    // If we've already injected and the content hasn't been replaced, skip.
    if (bodyEl.querySelector('[data-injected="provenance"]') &&
        bodyEl.querySelector('[data-injected="tests"]')) return;

    // Remove any stale injections from a previous render.
    bodyEl.querySelectorAll('[data-injected]').forEach(function (n) { n.remove(); });

    var key = deriveKey(bodyEl);
    var src = pickSource(key);
    var tests = pickTests(key);

    // Inject top: prepend the source strip.
    bodyEl.insertAdjacentHTML('afterbegin', provStripHTML(src));
    // Inject bottom: append the testing strip.
    bodyEl.insertAdjacentHTML('beforeend', testsStripHTML(tests));
  }

  // Candidate body containers we inject into. Each prototype has its own
  // drawer body class — these cover every variant we ship.
  var BODY_SELECTORS = [
    '.drawer-body',
    '#drawer-body',
    '.row-detail',
    '.row-detail-wrap td > div',
    '.cell-drawer-body'
  ];

  function watchEverywhere() {
    BODY_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(observe);
    });

    // Also handle bodies that appear later (e.g., row-detail rows inserted via JS).
    var bodyObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (!m.addedNodes) return;
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          BODY_SELECTORS.forEach(function (sel) {
            if (n.matches && n.matches(sel)) observe(n);
            if (n.querySelectorAll) n.querySelectorAll(sel).forEach(observe);
          });
        });
      });
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  function observe(el) {
    if (!el || el.dataset.provenanceWatched === '1') return;
    el.dataset.provenanceWatched = '1';

    // Inject once now (in case content is already present).
    if (el.innerHTML && el.innerHTML.length > 0) {
      injectInto(el);
    }

    var pending = false;
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        injectInto(el);
      }, 0);
    });
    mo.observe(el, { childList: true, subtree: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchEverywhere);
  } else {
    watchEverywhere();
  }
})();
