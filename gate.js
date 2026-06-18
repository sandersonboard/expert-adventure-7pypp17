/* Soft client-side password gate. Password: BORB.
   Runs synchronously in <head>; hides content until the password is entered for the session. */
(function () {
  var KEY = 'sufficiency-borb-gate';
  var PASS = 'BORB';

  if (sessionStorage.getItem(KEY) === '1') return;

  var hide = document.createElement('style');
  hide.id = 'gate-hide';
  hide.textContent =
    'html.gate-locked, html.gate-locked body { background: #FAFAFA !important; }' +
    'html.gate-locked body > *:not(#gate-overlay) { visibility: hidden !important; pointer-events: none !important; }';
  document.head.appendChild(hide);
  document.documentElement.classList.add('gate-locked');

  function unlock() {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    document.documentElement.classList.remove('gate-locked');
    var overlay = document.getElementById('gate-overlay');
    if (overlay) overlay.remove();
    var h = document.getElementById('gate-hide');
    if (h) h.remove();
  }

  function build() {
    if (document.getElementById('gate-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'gate-overlay';
    overlay.innerHTML =
      '<style>' +
        '#gate-overlay {' +
          'position: fixed; inset: 0; z-index: 99999;' +
          'background: #FAFAFA;' +
          'display: flex; align-items: center; justify-content: center;' +
          'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;' +
        '}' +
        '#gate-overlay .gate-card {' +
          'width: 360px; max-width: 92vw;' +
          'background: #FFFFFF;' +
          'border: 1px solid #E2E8F0;' +
          'border-radius: 12px;' +
          'box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);' +
          'padding: 28px;' +
        '}' +
        '#gate-overlay .gate-mark {' +
          'width: 32px; height: 22px;' +
          'margin-bottom: 16px;' +
          'background: url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 207 134%22><path fill=%22%23266C92%22 d=%22M103.591 133.082C85.404 133.082 68.317 126.157 55.458 113.6L0 59.368l10.464-10.23L65.935 103.41c10.051 9.803 23.42 15.2 37.642 15.2 14.223 0 27.633-5.411 37.683-15.255 5.288-5.122 9.35-11.276 12.075-18.298l11.207 10.96c-3.332 6.594-7.641 12.501-12.818 17.554-12.846 12.57-29.945 19.481-48.133 19.481zM141.302 29.698C131.238 19.867 117.855 14.443 103.62 14.443c-14.236 0-27.633 5.411-37.683 15.255-5.287 5.122-9.349 11.276-12.075 18.298L42.655 37.036c3.304-6.54 7.586-12.418 12.722-17.458l.15-.096C68.358 6.925 85.444 0 103.633 0c18.188 0 35.275 6.925 48.133 19.495L207.224 73.714l-10.464 10.23L141.302 29.7zM124.96 45.669c-5.7-5.576-13.286-8.647-21.354-8.647s-15.655 3.071-21.355 8.647c-5.81 5.686-8.99 13.479-8.797 21.506L60.414 54.425c2.051-7.146 5.989-13.7 11.372-18.973C80.282 27.164 91.6 22.593 103.633 22.593s23.323 4.571 31.804 12.859l55.458 54.219-10.463 10.23-55.472-54.232zM103.591 110.53c-12.033 0-23.323-4.57-31.804-12.86L16.33 43.452 26.793 33.222 82.265 87.455c5.7 5.576 13.286 8.646 21.354 8.646 8.069 0 15.655-3.07 21.355-8.646 5.81-5.687 8.991-13.48 8.797-21.506l13.039 12.749c-2.052 7.146-5.99 13.7-11.373 18.973-8.495 8.288-19.813 12.859-31.846 12.859z%22/></svg>") no-repeat left center / contain;' +
        '}' +
        '#gate-overlay h1 { font-size: 20px; font-weight: 600; margin: 0 0 6px; color: #0F172A; letter-spacing: -0.01em; }' +
        '#gate-overlay .gate-sub { font-size: 13px; color: #64748B; margin: 0 0 20px; line-height: 1.5; }' +
        '#gate-overlay input { width: 100%; padding: 9px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 14px; font-family: inherit; background: #FFFFFF; color: #0F172A; box-sizing: border-box; }' +
        '#gate-overlay input:focus { outline: none; border-color: #266C92; box-shadow: 0 0 0 3px rgba(38, 108, 146, 0.14); }' +
        '#gate-overlay button { width: 100%; margin-top: 10px; padding: 9px 12px; background: #266C92; color: #FFFFFF; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; }' +
        '#gate-overlay button:hover { background: #0E5371; }' +
        '#gate-overlay .gate-error { font-size: 12px; color: #BA2A2A; margin-top: 8px; min-height: 16px; }' +
        '#gate-overlay .gate-card.error input { border-color: #BA2A2A; }' +
        '#gate-overlay .gate-card.shake { animation: gateShake 250ms ease; }' +
        '@keyframes gateShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }' +
      '</style>' +
      '<div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gate-title">' +
        '<div class="gate-mark" aria-hidden="true"></div>' +
        '<h1 id="gate-title">Sufficiency at Scale</h1>' +
        '<p class="gate-sub">Password required to view this prototype.</p>' +
        '<form id="gate-form" autocomplete="off">' +
          '<input id="gate-input" type="password" autocomplete="off" autofocus placeholder="Password" aria-label="Password" />' +
          '<button type="submit">Unlock</button>' +
          '<div class="gate-error" id="gate-error" aria-live="polite"></div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);

    var form = document.getElementById('gate-form');
    var input = document.getElementById('gate-input');
    var card = overlay.querySelector('.gate-card');
    var err = document.getElementById('gate-error');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === PASS) {
        unlock();
      } else {
        card.classList.add('error', 'shake');
        err.textContent = 'Incorrect password';
        input.select();
        setTimeout(function () { card.classList.remove('shake'); }, 260);
      }
    });

    setTimeout(function () { try { input.focus(); } catch (e) {} }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
