/* Tour runtime — small floating corner card + pulsing highlight on the target.
   Mirrors the cw-tour-* pattern from sibling Optro prototypes.

   Reads window.TOUR = { title, steps: [{selector, title, body}] }
   Auto-starts on first visit per session; topbar button re-launches.

   Public: window.Tour.boot()/start()/next()/prev()/end()
*/

(function () {
  const SEEN_KEY = (slug) => 'tour-seen-' + slug;
  const POS_KEY  = 'tour-card-pos-v1';
  const HIGHLIGHT_CLASS = 'tour-highlight';
  const slug = (location.pathname.split('/').pop() || 'index').replace(/[?#].*$/, '');

  let cardEl = null;
  let highlightedEl = null;
  let stepIdx = 0;
  let active = false;

  function $$(sel, root) {
    try { return (root || document).querySelector(sel); } catch (e) { return null; }
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clearHighlight() {
    if (highlightedEl) {
      highlightedEl.classList.remove(HIGHLIGHT_CLASS);
      highlightedEl = null;
    }
  }

  function applyHighlight(selector) {
    clearHighlight();
    if (!selector) return;
    const el = $$(selector);
    if (!el) return;
    el.classList.add(HIGHLIGHT_CLASS);
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    highlightedEl = el;
  }

  function render() {
    const steps = (window.TOUR && window.TOUR.steps) || [];
    const total = steps.length;
    const step = steps[stepIdx];
    if (!step) { end(); return; }

    const isFirst = stepIdx === 0;
    const isLast = stepIdx === total - 1;
    const meta = total + (total === 1 ? ' stop' : ' stops');
    const name = (window.TOUR && window.TOUR.title) || 'Product tour';

    if (!cardEl) {
      cardEl = document.createElement('div');
      cardEl.className = 'tour-card';
      cardEl.setAttribute('role', 'dialog');
      cardEl.setAttribute('aria-label', 'Product tour');
      document.body.appendChild(cardEl);
      applySavedPosition(cardEl);
    }

    cardEl.innerHTML = `
      <div class="tour-card-header" data-tour-handle>
        <div class="tour-card-avatar" aria-label="Tour guide">🧑‍🚀</div>
        <div class="tour-card-who">
          <span class="name">${escapeHTML(name)}</span>
          <span class="meta">${escapeHTML(meta)}</span>
        </div>
        <button class="tour-card-close" data-tour-action="end" aria-label="Close tour" title="Close tour">×</button>
      </div>
      <div class="tour-card-body">
        <div class="tour-card-title">${escapeHTML(step.title || '')}</div>
        <p class="tour-card-text">${escapeHTML(step.body || '')}</p>
      </div>
      <div class="tour-card-footer">
        <span class="tour-progress">${String(stepIdx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
        <div class="tour-actions">
          <button class="tour-btn" data-tour-action="prev"${isFirst ? ' disabled' : ''}>← Back</button>
          <button class="tour-skip" data-tour-action="end">Skip</button>
          <button class="tour-btn primary" data-tour-action="next">${isLast ? 'Done' : 'Next →'}</button>
        </div>
      </div>
    `;

    cardEl.querySelectorAll('[data-tour-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const a = btn.getAttribute('data-tour-action');
        if (a === 'next') next();
        else if (a === 'prev') prev();
        else if (a === 'end') end();
      });
    });

    wireDrag(cardEl);
    requestAnimationFrame(() => cardEl.classList.add('visible'));
    applyHighlight(step.selector);
  }

  // ----- Drag handling -----
  function wireDrag(card) {
    const handle = card.querySelector('[data-tour-handle]');
    if (!handle || handle.dataset.tourDragWired === '1') return;
    handle.dataset.tourDragWired = '1';

    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    function getPoint(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    function onDown(e) {
      if (e.target.closest('button')) return;
      const rect = card.getBoundingClientRect();
      const pt = getPoint(e);
      startX = pt.x; startY = pt.y;
      startLeft = rect.left; startTop = rect.top;
      card.style.left = startLeft + 'px';
      card.style.top = startTop + 'px';
      card.style.bottom = 'auto';
      card.style.right = 'auto';
      dragging = true;
      handle.classList.add('grabbing');
      document.body.style.userSelect = 'none';
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      const pt = getPoint(e);
      const dx = pt.x - startX;
      const dy = pt.y - startY;
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const left = Math.max(8, Math.min(window.innerWidth - w - 8, startLeft + dx));
      const top  = Math.max(8, Math.min(window.innerHeight - h - 8, startTop + dy));
      card.style.left = left + 'px';
      card.style.top = top + 'px';
      e.preventDefault();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('grabbing');
      document.body.style.userSelect = '';
      try {
        sessionStorage.setItem(POS_KEY, JSON.stringify({ left: card.style.left, top: card.style.top }));
      } catch (e) {}
    }

    handle.addEventListener('mousedown', onDown);
    handle.addEventListener('touchstart', onDown, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  function applySavedPosition(card) {
    try {
      const raw = sessionStorage.getItem(POS_KEY);
      if (!raw) return;
      const pos = JSON.parse(raw);
      if (!pos.left || !pos.top) return;
      const w = card.offsetWidth || 352;
      const h = card.offsetHeight || 280;
      const maxLeft = Math.max(0, window.innerWidth - w);
      const maxTop  = Math.max(0, window.innerHeight - h);
      const left = Math.min(maxLeft, Math.max(0, parseInt(pos.left, 10) || 0));
      const top  = Math.min(maxTop,  Math.max(0, parseInt(pos.top, 10) || 0));
      card.style.left = left + 'px';
      card.style.top = top + 'px';
      card.style.bottom = 'auto';
      card.style.right = 'auto';
    } catch (e) {}
  }

  // ----- Navigation -----
  function start() {
    if (!window.TOUR || !Array.isArray(window.TOUR.steps) || !window.TOUR.steps.length) return;
    active = true;
    stepIdx = 0;
    render();
    document.addEventListener('keydown', onKey, true);
  }
  function next() {
    if (!active) return;
    if (stepIdx >= window.TOUR.steps.length - 1) { end(); return; }
    stepIdx++;
    render();
  }
  function prev() {
    if (!active || stepIdx === 0) return;
    stepIdx--;
    render();
  }
  function end() {
    active = false;
    clearHighlight();
    if (cardEl) { cardEl.remove(); cardEl = null; }
    try { sessionStorage.setItem(SEEN_KEY(slug), '1'); } catch (e) {}
    document.removeEventListener('keydown', onKey, true);
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape')                                  { e.preventDefault(); end(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter')    { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft')                          { e.preventDefault(); prev(); }
  }

  // ----- Topbar launcher button -----
  function injectRestartButton() {
    const topbar = $$('.app-topbar');
    if (!topbar) return;
    if (topbar.querySelector('.tour-restart')) return;
    const btn = document.createElement('button');
    btn.className = 'tour-restart';
    btn.type = 'button';
    btn.setAttribute('data-action', 'start-tour');
    btn.title = ((window.TOUR && window.TOUR.steps) ? window.TOUR.steps.length : 0) + '-stop product tour';
    btn.innerHTML = '<span class="tour-restart-avatar" aria-hidden="true">🧑‍🚀</span><span>Product tour</span>';
    btn.addEventListener('click', () => {
      // Re-launch from step 1 regardless of seen state
      end();
      start();
    });
    const avatar = topbar.querySelector('.avatar');
    if (avatar) topbar.insertBefore(btn, avatar);
    else topbar.appendChild(btn);
  }

  // ----- Boot -----
  function boot() {
    if (!window.TOUR || !Array.isArray(window.TOUR.steps) || !window.TOUR.steps.length) return;
    injectRestartButton();

    // Respect ?tour=off (used for screenshots / direct deep-link visits)
    const params = new URLSearchParams(location.search);
    if (params.get('tour') === 'off') return;

    let seen = false;
    try { seen = !!sessionStorage.getItem(SEEN_KEY(slug)); } catch (e) {}
    if (!seen) setTimeout(start, 600);
  }

  window.Tour = { boot, start, next, prev, end };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
