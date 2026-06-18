/* ============================================================
   sources-link.js
   ----------------------------------------------------------------
   Cross-page glue that ties every option prototype back to the
   sources catalog (option-12-prospectus.html):

     1. Injects a "Sources" nav link at the bottom of the Luna
        sidebar (.app-sidebar nav), after Reports.
     2. Injects an equivalent item into the Midship sidebar
        (.midship-sidebar nav.midship-nav) so the toggle stays
        consistent across design systems.
     3. Upgrades the provenance strip's title (.prov-title) into
        an anchor pointing to option-12-prospectus.html#<system-slug>,
        so a user can click "NetSuite UAR Export · API pull" and
        land on the NetSuite section of the sources catalog.

   Strategy notes:
     * The Midship sidebar is injected by ds-toggle.js at runtime.
       We can't assume it exists at DOMContentLoaded — so we run
       once now, and then use a MutationObserver on body to upgrade
       the Midship sidebar as soon as it mounts.
     * Same goes for .prov-strip — provenance.js injects it later,
       on drawer/row open. We observe body and react.
   ============================================================ */

(function () {
  var SOURCES_PAGE = 'option-12-prospectus.html';

  // ----- helpers --------------------------------------------------

  function currentSlug() {
    var parts = (location.pathname || '').split('/');
    return parts[parts.length - 1] || '';
  }

  function isOnSourcesPage() {
    return currentSlug() === SOURCES_PAGE;
  }

  // Derive an anchor slug from the source's display system. The
  // anchors in option-12-prospectus.html live by integration name
  // (netsuite, okta, aws-iam, salesforce, snowflake, upload, agent,
  // email, scheduled, slack). We pick the first matching keyword.
  function anchorFor(text) {
    var t = String(text || '').toLowerCase();
    if (t.indexOf('netsuite')   !== -1) return 'netsuite';
    if (t.indexOf('okta')       !== -1) return 'okta';
    if (t.indexOf('aws iam')    !== -1) return 'aws-iam';
    if (t.indexOf('iam')        !== -1) return 'aws-iam';
    if (t.indexOf('salesforce') !== -1) return 'salesforce';
    if (t.indexOf('snowflake')  !== -1) return 'snowflake';
    if (t.indexOf('browser upload') !== -1) return 'upload';
    if (t.indexOf('upload')     !== -1) return 'upload';
    if (t.indexOf('agent')      !== -1) return 'agent';
    if (t.indexOf('email')      !== -1) return 'email';
    if (t.indexOf('@')          !== -1) return 'email';
    if (t.indexOf('cron')       !== -1) return 'scheduled';
    if (t.indexOf('airflow')    !== -1) return 'scheduled';
    if (t.indexOf('scheduled')  !== -1) return 'scheduled';
    if (t.indexOf('slack')      !== -1) return 'slack';
    if (t.indexOf('#')          !== -1) return 'slack';
    // Fallback: kebab-case first token.
    var first = t.replace(/[^a-z0-9 ]+/g, '').trim().split(/\s+/)[0] || '';
    return first;
  }

  // ----- Luna sidebar --------------------------------------------

  function injectLunaSourcesLink() {
    var nav = document.querySelector('.app-sidebar nav');
    if (!nav) return;
    if (nav.querySelector('a[data-sources-link="1"]')) return;

    // Match the existing nav link visual: an SVG mask icon + label.
    var iconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
      + '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>'
      + '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
      + '</svg>';
    var mask = "url('data:image/svg+xml;utf8," + encodeURIComponent(iconSVG) + "') no-repeat center/contain";

    var active = isOnSourcesPage() ? ' class="active"' : '';
    var html = '<a href="' + SOURCES_PAGE + '"' + active + ' data-sources-link="1">'
      + '<span class="nav-icon" style="-webkit-mask: ' + mask + ';"></span>Sources'
      + '</a>';

    // If we're activating Sources, drop .active off any existing link
    // so only one is highlighted.
    if (isOnSourcesPage()) {
      nav.querySelectorAll('a.active').forEach(function (a) { a.classList.remove('active'); });
    }
    nav.insertAdjacentHTML('beforeend', html);
  }

  // ----- Midship sidebar -----------------------------------------
  // The Midship sidebar mirrors the actual product layout — its
  // nav already includes Admin → Integrations, so we don't add a
  // separate "Sources" item. The on-page Sources strip (top of
  // every option) handles in-context discovery in Midship mode.
  function injectMidshipSourcesLink() { /* intentionally a no-op */ }

  // ----- provenance strip upgrade --------------------------------

  function upgradeProvStrip(strip) {
    if (!strip || strip.dataset.sourcesLinked === '1') return;
    var titleEl = strip.querySelector('.prov-title');
    if (!titleEl) return;
    // Already an <a>? Skip.
    if (titleEl.tagName === 'A') {
      strip.dataset.sourcesLinked = '1';
      return;
    }

    var text = titleEl.textContent || '';
    // The title is "<system> · <method>" — use the system half for the anchor.
    var systemHalf = text.split('·')[0].trim();
    var slug = anchorFor(systemHalf);
    var href = SOURCES_PAGE + (slug ? '#' + slug : '');

    var a = document.createElement('a');
    a.className = 'prov-title';
    a.href = href;
    a.setAttribute('data-sources-link', '1');
    a.textContent = text;
    // Light inline style so the link is visibly clickable without
    // requiring a CSS change.
    a.style.color = 'inherit';
    a.style.textDecoration = 'underline';
    a.style.textDecorationStyle = 'dotted';
    a.style.textUnderlineOffset = '2px';
    a.style.cursor = 'pointer';

    titleEl.replaceWith(a);
    strip.dataset.sourcesLinked = '1';
  }

  function scanProvStrips(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.prov-strip').forEach(upgradeProvStrip);
  }

  // ----- bootstrapping -------------------------------------------

  function run() {
    injectLunaSourcesLink();
    injectMidshipSourcesLink();
    scanProvStrips(document);
  }

  function startObserver() {
    var mo = new MutationObserver(function (mutations) {
      // Cheap fast-path: if neither sidebar nor strip is missing/new, skip.
      var needLuna = !!document.querySelector('.app-sidebar nav')
        && !document.querySelector('.app-sidebar nav a[data-sources-link="1"]');
      var needMidship = !!document.querySelector('.midship-sidebar nav.midship-nav')
        && !document.querySelector('.midship-sidebar nav.midship-nav a[data-sources-link="1"]');

      if (needLuna)    injectLunaSourcesLink();
      if (needMidship) injectMidshipSourcesLink();

      // Strip upgrades: walk only added nodes for efficiency.
      mutations.forEach(function (m) {
        if (!m.addedNodes) return;
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches('.prov-strip')) upgradeProvStrip(n);
          if (n.querySelectorAll) scanProvStrips(n);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    run();
    startObserver();
    // ds-toggle.js may run a tick after us; give it a beat and re-run.
    setTimeout(run, 50);
    setTimeout(run, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
