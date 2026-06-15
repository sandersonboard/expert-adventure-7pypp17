/* ============================================================
   Shared UX-fixes runtime.
   Exposes window.UX with helpers for:
     - confirm({ ... })            confirmation modal + undo growl
     - bumpBurndown(el, delta)     increment burn-down meter
     - cheatsheet({ shortcuts })   keyboard cheatsheet (also via "?")
     - renderFilterChips(...)      removable filter chips
     - removeFilter(id)            page-supplied hook
     - recoverPill({ ... })        recovery affordance pill builder
     - shortcuts                   page-supplied array

   Auto-wires:
     - [data-ux-confirm]           any element opens the confirm modal
     - <div class="ux-burndown">   renders + tracks burn-down
     - <div class="ux-filter-chips"> renders from window.UX.filters
     - <a class="ux-recover">      auto-styles next-step pill
     - "?" keypress                opens cheatsheet
     - Topbar hint                 injects "Press ? for shortcuts"

   Loads AFTER flow.js. Idempotent.
   ============================================================ */

(function () {
  'use strict';

  if (window.UX && window.UX.__initialized) return;

  // ---------- Tiny utilities ----------
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === 'class') node.className = props[k];
        else if (k === 'html') node.innerHTML = props[k];
        else if (k === 'text') node.textContent = props[k];
        else if (k === 'style' && typeof props[k] === 'object') {
          Object.assign(node.style, props[k]);
        } else if (k.indexOf('on') === 0 && typeof props[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), props[k]);
        } else if (props[k] != null && props[k] !== false) {
          node.setAttribute(k, props[k]);
        }
      });
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null || c === false) return;
        if (typeof c === 'string' || typeof c === 'number') {
          node.appendChild(document.createTextNode(String(c)));
        } else {
          node.appendChild(c);
        }
      });
    }
    return node;
  }

  function fmtNum(n) {
    var v = Number(n);
    if (!isFinite(v)) return String(n);
    return v.toLocaleString('en-US');
  }

  function ensureGrowlStack() {
    var stack = document.querySelector('.ux-growl-stack');
    if (!stack) {
      stack = el('div', { class: 'ux-growl-stack' });
      document.body.appendChild(stack);
    }
    return stack;
  }

  // ---------- Focus trap ----------
  function trapFocus(modal) {
    var focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return function () {};
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    function onKey(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    modal.addEventListener('keydown', onKey);
    setTimeout(function () { first.focus(); }, 60);
    return function () { modal.removeEventListener('keydown', onKey); };
  }

  // ============================================================
  // 1. CONFIRM MODAL + UNDO GROWL
  // ============================================================
  function showConfirm(opts) {
    opts = opts || {};
    var title = opts.title || 'Confirm action?';
    var body = opts.body || '';
    var impact = opts.impactSummary || '';
    var items = Array.isArray(opts.items) ? opts.items : null;
    var undoSeconds = Math.max(0, Number(opts.undoSeconds == null ? 10 : opts.undoSeconds));
    var requireReason = !!opts.requireReason;
    var confirmLabel = opts.confirmLabel || (opts.danger ? 'Confirm' : 'Continue');
    var cancelLabel = opts.cancelLabel || 'Cancel';

    // Build modal
    var backdrop = el('div', { class: 'ux-confirm-backdrop', role: 'presentation' });
    var modal = el('div', {
      class: 'ux-confirm-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'ux-confirm-title'
    });

    var closeBtn = el('button', {
      class: 'ux-confirm-close',
      type: 'button',
      'aria-label': 'Close',
      html: '&times;'
    });

    var head = el('div', { class: 'ux-confirm-head' }, [
      el('h3', { id: 'ux-confirm-title', text: title }),
      closeBtn
    ]);

    var bodyEl = el('div', { class: 'ux-confirm-body' });
    if (body) bodyEl.appendChild(el('p', { html: body }));

    if (impact) {
      bodyEl.appendChild(el('div', { class: 'ux-confirm-impact' }, [
        el('span', { class: 'ux-confirm-impact-icon', text: '!' }),
        el('span', { html: '<b>Impact:</b> ' + impact })
      ]));
    }

    if (items && items.length) {
      var first = items.slice(0, 5);
      var rest = items.length - first.length;
      var list = el('ul', { class: 'ux-confirm-items' });
      first.forEach(function (item) {
        list.appendChild(el('li', { text: item }));
      });
      if (rest > 0) {
        var moreBtn = el('button', {
          class: 'ux-confirm-more',
          type: 'button',
          text: '+' + rest + ' more'
        });
        moreBtn.addEventListener('click', function () {
          // Expand: render the rest
          items.slice(5).forEach(function (item) {
            list.insertBefore(el('li', { text: item }), moreBtn.parentNode);
          });
          moreBtn.remove();
        });
        list.appendChild(el('li', null, [moreBtn]));
      }
      bodyEl.appendChild(list);
    }

    var reasonEl = null;
    if (requireReason) {
      bodyEl.appendChild(el('label', {
        class: 'ux-confirm-reason-label',
        text: 'Reason (required)'
      }));
      reasonEl = el('textarea', {
        class: 'ux-confirm-reason',
        placeholder: 'Why are you doing this? (min 10 chars)'
      });
      bodyEl.appendChild(reasonEl);
      bodyEl.appendChild(el('span', {
        class: 'ux-confirm-reason-hint',
        text: 'Saved to the audit trail.'
      }));
    }

    var cancelBtn = el('button', {
      class: 'btn',
      type: 'button',
      text: cancelLabel
    });
    var confirmBtn = el('button', {
      class: 'btn primary',
      type: 'button',
      text: confirmLabel
    });
    if (requireReason) confirmBtn.disabled = true;

    var foot = el('div', { class: 'ux-confirm-foot' }, [cancelBtn, confirmBtn]);

    modal.appendChild(head);
    modal.appendChild(bodyEl);
    modal.appendChild(foot);

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Live-validate reason
    if (reasonEl) {
      reasonEl.addEventListener('input', function () {
        var ok = reasonEl.value.trim().length >= 10;
        confirmBtn.disabled = !ok;
      });
    }

    // Open
    requestAnimationFrame(function () {
      backdrop.classList.add('open');
      modal.classList.add('open');
    });

    var releaseTrap = trapFocus(modal);
    var prevActive = document.activeElement;

    function close() {
      backdrop.classList.remove('open');
      modal.classList.remove('open');
      releaseTrap();
      document.removeEventListener('keydown', onEsc);
      setTimeout(function () {
        if (backdrop.parentNode) backdrop.remove();
        if (modal.parentNode) modal.remove();
      }, 220);
      if (prevActive && typeof prevActive.focus === 'function') {
        try { prevActive.focus(); } catch (e) {}
      }
    }

    function onEsc(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onEsc);
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);

    confirmBtn.addEventListener('click', function () {
      if (confirmBtn.disabled) return;
      var reason = reasonEl ? reasonEl.value.trim() : null;
      close();
      var result = {};
      if (reason != null) result.reason = reason;
      try {
        if (typeof opts.onConfirm === 'function') opts.onConfirm(result);
      } catch (err) {
        console.error('UX.confirm onConfirm error', err);
      }
      if (undoSeconds > 0) {
        showUndoGrowl({
          label: opts.doneLabel || 'Done',
          undoSeconds: undoSeconds,
          onUndo: opts.onUndo
        });
      } else if (opts.doneLabel) {
        showUndoGrowl({
          label: opts.doneLabel,
          undoSeconds: 0
        });
      }
    });
  }

  function showUndoGrowl(opts) {
    opts = opts || {};
    var seconds = Math.max(0, Number(opts.undoSeconds == null ? 10 : opts.undoSeconds));
    var label = opts.label || 'Done';
    var stack = ensureGrowlStack();

    var ring = null;
    var ringFg = null;
    var ringNum = null;
    if (seconds > 0) {
      var CIRC = 2 * Math.PI * 8; // r=8
      ring = el('div', { class: 'ux-growl-ring' });
      ring.innerHTML =
        '<svg viewBox="0 0 22 22">' +
        '<circle class="bg" cx="11" cy="11" r="8"></circle>' +
        '<circle class="fg" cx="11" cy="11" r="8" ' +
        'stroke-dasharray="' + CIRC.toFixed(2) + '" ' +
        'stroke-dashoffset="0"></circle>' +
        '</svg>' +
        '<div class="ux-growl-ring-num">' + seconds + '</div>';
      ringFg = ring.querySelector('circle.fg');
      ringNum = ring.querySelector('.ux-growl-ring-num');
    }

    var icon = el('span', { class: 'ux-growl-icon', text: '✓' });
    var text = el('span', { class: 'ux-growl-text', html: '<b>' + label + '</b>' });
    var undoBtn = null;
    if (seconds > 0 && typeof opts.onUndo === 'function') {
      undoBtn = el('button', {
        class: 'ux-growl-undo',
        type: 'button',
        text: 'Undo'
      });
    }

    var growl = el('div', { class: 'ux-growl' });
    growl.appendChild(icon);
    growl.appendChild(text);
    if (ring) growl.appendChild(ring);
    if (undoBtn) growl.appendChild(undoBtn);
    stack.appendChild(growl);

    requestAnimationFrame(function () { growl.classList.add('open'); });

    var remaining = seconds;
    var timer = null;
    var CIRC = 2 * Math.PI * 8;

    function dismiss() {
      if (timer) { clearInterval(timer); timer = null; }
      growl.classList.add('dismissing');
      setTimeout(function () {
        if (growl.parentNode) growl.remove();
      }, 220);
    }

    if (seconds > 0) {
      timer = setInterval(function () {
        remaining -= 1;
        if (ringNum) ringNum.textContent = Math.max(0, remaining);
        if (ringFg) {
          var pct = remaining / seconds;
          ringFg.setAttribute('stroke-dashoffset', String(CIRC * (1 - pct)));
        }
        if (remaining <= 0) dismiss();
      }, 1000);
    } else {
      setTimeout(dismiss, 2200);
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', function () {
        if (timer) { clearInterval(timer); timer = null; }
        try { opts.onUndo(); } catch (e) { console.error(e); }
        // Replace contents with reverted state
        growl.setAttribute('data-mode', 'reverted');
        growl.innerHTML = '';
        growl.appendChild(el('span', { class: 'ux-growl-icon', text: '↶' }));
        growl.appendChild(el('span', { class: 'ux-growl-text', html: '<b>Reverted</b>' }));
        setTimeout(dismiss, 1800);
      });
    }
  }

  // Auto-wire [data-ux-confirm]
  function wireConfirmAttrs(root) {
    var nodes = (root || document).querySelectorAll('[data-ux-confirm]:not([data-ux-confirm-wired])');
    nodes.forEach(function (node) {
      node.setAttribute('data-ux-confirm-wired', '1');
      node.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var d = node.dataset;
        showConfirm({
          title: d.uxConfirmTitle || d.uxConfirm || 'Confirm action?',
          body: d.uxConfirmBody || '',
          impactSummary: d.uxConfirmImpact || '',
          undoSeconds: d.uxConfirmUndo == null ? 10 : Number(d.uxConfirmUndo),
          requireReason: d.uxConfirmReason === 'true' || d.uxConfirmReason === '1',
          confirmLabel: d.uxConfirmLabel || undefined,
          doneLabel: d.uxConfirmDone || undefined,
          danger: d.uxConfirmDanger === 'true',
          onConfirm: function (result) {
            // Fire a custom event so pages can listen
            node.dispatchEvent(new CustomEvent('ux:confirmed', {
              bubbles: true,
              detail: result
            }));
          },
          onUndo: function () {
            node.dispatchEvent(new CustomEvent('ux:undone', { bubbles: true }));
          }
        });
      });
    });
  }

  // ============================================================
  // 2. BURN-DOWN METER
  // ============================================================
  function renderBurndown(node) {
    if (node.getAttribute('data-ux-burndown-rendered') === '1') {
      updateBurndown(node);
      return;
    }
    node.setAttribute('data-ux-burndown-rendered', '1');

    var label = node.dataset.label || 'cleared';
    var bar = el('div', { class: 'ux-burndown-bar' });
    var fill = el('div', { class: 'ux-burndown-fill' });
    bar.appendChild(fill);

    var caption = el('div', { class: 'ux-burndown-caption' });
    var doneSpan = el('span', { class: 'ux-burndown-done' });
    var sep1 = el('span', { class: 'ux-burndown-sep', text: '·' });
    var togoSpan = el('span', { class: 'ux-burndown-togo' });
    var etaSpan = el('span', { class: 'ux-burndown-eta' });
    caption.appendChild(doneSpan);
    caption.appendChild(sep1);
    caption.appendChild(togoSpan);
    caption.appendChild(etaSpan);

    var bump = el('div', { class: 'ux-burndown-bump' });

    node.appendChild(bar);
    node.appendChild(caption);
    node.appendChild(bump);

    node.__ux = {
      fill: fill,
      done: doneSpan,
      togo: togoSpan,
      eta: etaSpan,
      bump: bump,
      label: label
    };

    updateBurndown(node);
  }

  function updateBurndown(node) {
    var refs = node.__ux;
    if (!refs) return;
    var total = Math.max(0, Number(node.dataset.total) || 0);
    var cleared = Math.max(0, Math.min(total, Number(node.dataset.cleared) || 0));
    var togo = total - cleared;
    var pct = total > 0 ? (cleared / total) * 100 : 0;

    refs.fill.style.width = pct.toFixed(1) + '%';
    refs.done.innerHTML = '<b>' + fmtNum(cleared) + '</b> of <b>' + fmtNum(total) + '</b> ' + refs.label;
    refs.togo.innerHTML = '<b>' + fmtNum(togo) + '</b> to go';

    // ETA: prefer explicit data-rate-per-min; else estimate from elapsed
    var rate = Number(node.dataset.ratePerMin);
    if (!isFinite(rate) || rate <= 0) {
      var startTs = Number(node.dataset.startTs);
      if (!isFinite(startTs) || startTs <= 0) {
        startTs = Date.now();
        node.dataset.startTs = String(startTs);
      }
      var initial = Number(node.dataset.initialCleared);
      if (!isFinite(initial)) {
        initial = cleared;
        node.dataset.initialCleared = String(initial);
      }
      var elapsedMin = (Date.now() - startTs) / 60000;
      var diff = cleared - initial;
      rate = (elapsedMin > 0.05 && diff > 0) ? (diff / elapsedMin) : 0;
    }

    if (togo === 0) {
      refs.eta.innerHTML = 'ETA <b>now</b>';
    } else if (rate > 0) {
      var minsLeft = togo / rate;
      var done = new Date(Date.now() + minsLeft * 60000);
      var hh = String(done.getHours()).padStart(2, '0');
      var mm = String(done.getMinutes()).padStart(2, '0');
      refs.eta.innerHTML = 'ETA <b>' + hh + ':' + mm + '</b>';
    } else {
      refs.eta.innerHTML = 'ETA <b>—</b>';
    }
  }

  function bumpBurndown(node, delta) {
    if (!node || !node.__ux) return;
    delta = Number(delta) || 1;
    var current = Number(node.dataset.cleared) || 0;
    node.dataset.cleared = String(current + delta);
    updateBurndown(node);

    var bump = node.__ux.bump;
    bump.textContent = (delta > 0 ? '+' : '') + fmtNum(delta);
    bump.classList.remove('show');
    // force reflow
    void bump.offsetWidth;
    bump.classList.add('show');
    setTimeout(function () { bump.classList.remove('show'); }, 1100);
  }

  function autowireBurndowns(root) {
    var nodes = (root || document).querySelectorAll('.ux-burndown');
    nodes.forEach(renderBurndown);
  }

  // ============================================================
  // 3. KEYBOARD CHEATSHEET
  // ============================================================
  function renderCheatsheet() {
    var existing = document.querySelector('.ux-cheat-modal');
    if (existing) {
      // Toggle close
      existing.classList.remove('open');
      var bd = document.querySelector('.ux-cheat-backdrop');
      if (bd) bd.classList.remove('open');
      setTimeout(function () {
        if (existing.parentNode) existing.remove();
        if (bd && bd.parentNode) bd.remove();
      }, 200);
      return;
    }

    var shortcuts = window.UX.shortcuts || [];
    if (!shortcuts.length) {
      shortcuts = [
        { key: '?', label: 'Show this cheatsheet', group: 'General' },
        { key: 'Esc', label: 'Close any modal', group: 'General' }
      ];
    }

    // Group
    var groups = {};
    var order = [];
    shortcuts.forEach(function (s) {
      var g = s.group || 'General';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(s);
    });

    var backdrop = el('div', { class: 'ux-cheat-backdrop' });
    var modal = el('div', {
      class: 'ux-cheat-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Keyboard shortcuts'
    });

    var closeBtn = el('button', {
      class: 'ux-cheat-close',
      type: 'button',
      'aria-label': 'Close',
      html: '&times;'
    });

    var head = el('div', { class: 'ux-cheat-head' }, [
      el('div', null, [
        el('h3', { text: 'Keyboard shortcuts' }),
        el('div', { class: 'ux-cheat-sub', text: 'Press Esc to close' })
      ]),
      closeBtn
    ]);

    var bodyEl = el('div', { class: 'ux-cheat-body' });
    order.forEach(function (g) {
      var grpNode = el('div', { class: 'ux-cheat-group' });
      grpNode.appendChild(el('h4', { text: g }));
      var rows = el('div', { class: 'ux-cheat-rows' });
      groups[g].forEach(function (s) {
        rows.appendChild(el('div', { class: 'ux-cheat-label', text: s.label }));
        rows.appendChild(renderKeys(s.key));
      });
      grpNode.appendChild(rows);
      bodyEl.appendChild(grpNode);
    });

    modal.appendChild(head);
    modal.appendChild(bodyEl);
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    requestAnimationFrame(function () {
      backdrop.classList.add('open');
      modal.classList.add('open');
    });

    var releaseTrap = trapFocus(modal);

    function close() {
      backdrop.classList.remove('open');
      modal.classList.remove('open');
      releaseTrap();
      document.removeEventListener('keydown', onEsc);
      setTimeout(function () {
        if (backdrop.parentNode) backdrop.remove();
        if (modal.parentNode) modal.remove();
      }, 220);
    }
    function onEsc(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onEsc);
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
  }

  function renderKeys(spec) {
    var wrap = el('div', { class: 'ux-cheat-keys' });
    var parts = String(spec).split(/\s+then\s+|\s*,\s*/);
    parts.forEach(function (part, idx) {
      if (idx > 0) wrap.appendChild(el('span', { class: 'ux-cheat-plus', text: 'then' }));
      var combo = part.split('+');
      combo.forEach(function (k, i) {
        if (i > 0) wrap.appendChild(el('span', { class: 'ux-cheat-plus', text: '+' }));
        wrap.appendChild(el('span', { class: 'ux-cheat-key', text: k.trim() }));
      });
    });
    return wrap;
  }

  function maybeInjectTopbarHint() {
    if (!window.UX.shortcuts || !window.UX.shortcuts.length) return;
    if (sessionStorage.getItem('ux-cheat-hint-dismissed') === '1') return;
    var topbar = document.querySelector('.app-topbar');
    if (!topbar) return;
    if (topbar.querySelector('.ux-topbar-hint')) return;

    var hint = el('span', { class: 'ux-topbar-hint', title: 'Open keyboard shortcuts' }, [
      'Press ',
      el('span', { class: 'ux-topbar-hint-key', text: '?' }),
      ' for shortcuts'
    ]);
    var dismiss = el('button', {
      class: 'ux-topbar-hint-dismiss',
      type: 'button',
      'aria-label': 'Dismiss hint',
      html: '&times;'
    });
    hint.appendChild(dismiss);

    hint.addEventListener('click', function (e) {
      if (e.target === dismiss) return;
      renderCheatsheet();
    });
    dismiss.addEventListener('click', function (e) {
      e.stopPropagation();
      sessionStorage.setItem('ux-cheat-hint-dismissed', '1');
      hint.remove();
    });

    // Insert before the close-countdown / avatar, fall back to append
    var spacer = topbar.querySelector('.topbar-spacer');
    var anchor = topbar.querySelector('.close-countdown') ||
                 topbar.querySelector('.avatar') ||
                 topbar.querySelector('.customer-switch');
    if (anchor && anchor.parentNode === topbar) {
      topbar.insertBefore(hint, anchor);
    } else if (spacer && spacer.nextSibling) {
      topbar.insertBefore(hint, spacer.nextSibling);
    } else {
      topbar.appendChild(hint);
    }
  }

  function isTypingTarget(t) {
    if (!t) return false;
    var tag = (t.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (t.isContentEditable) return true;
    return false;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== '?' && !(e.key === '/' && e.shiftKey)) return;
    if (isTypingTarget(e.target)) return;
    // Only trigger when no other modal is open from us; renderCheatsheet toggles
    if (document.querySelector('.ux-confirm-modal.open')) return;
    e.preventDefault();
    renderCheatsheet();
  });

  // ============================================================
  // 4. FILTER CHIPS
  // ============================================================
  function renderFilterChips(target, filters, onRemove) {
    var container = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('ux-filter-chips');

    var label = container.dataset.label || 'Filters';
    var emptyLabel = container.dataset.emptyLabel || 'Showing all';

    container.appendChild(el('span', { class: 'ux-filter-chips-label', text: label }));

    if (!filters || !filters.length) {
      container.appendChild(el('span', { class: 'ux-filter-empty', text: emptyLabel }));
      return;
    }

    filters.forEach(function (f) {
      var chip = el('span', { class: 'ux-chip', 'data-filter-id': f.id });
      var labelHtml = '';
      if (f.value != null && f.value !== '') {
        labelHtml = '<b>' + escapeHtml(f.label) + ':</b>' + escapeHtml(f.value);
      } else {
        labelHtml = escapeHtml(f.label);
      }
      chip.appendChild(el('span', { class: 'ux-chip-label', html: labelHtml }));
      var x = el('button', {
        class: 'ux-chip-x',
        type: 'button',
        'aria-label': 'Remove filter ' + f.label,
        html: '&times;'
      });
      x.addEventListener('click', function () {
        if (typeof onRemove === 'function') {
          onRemove(f.id, f);
        } else if (typeof window.UX.removeFilter === 'function') {
          window.UX.removeFilter(f.id, f);
        }
      });
      chip.appendChild(x);
      container.appendChild(chip);
    });

    var clearAll = el('button', {
      class: 'ux-filter-clear-all',
      type: 'button',
      text: 'Clear all'
    });
    clearAll.addEventListener('click', function () {
      filters.slice().forEach(function (f) {
        if (typeof onRemove === 'function') onRemove(f.id, f);
        else if (typeof window.UX.removeFilter === 'function') window.UX.removeFilter(f.id, f);
      });
    });
    container.appendChild(clearAll);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function autowireFilterChips(root) {
    var nodes = (root || document).querySelectorAll(
      '.ux-filter-chips:not([data-ux-filter-rendered])'
    );
    nodes.forEach(function (node) {
      node.setAttribute('data-ux-filter-rendered', '1');
      var filters = window.UX.filters || [];
      renderFilterChips(node, filters);
    });
  }

  // ============================================================
  // 5. RECOVERY AFFORDANCE
  // ============================================================
  function recoverPill(opts) {
    opts = opts || {};
    var node = el('a', {
      class: 'ux-recover',
      href: opts.href || '#',
      'data-tone': opts.tone || null,
      'data-ux-recover-action': opts.action || null
    });
    if (opts.icon) node.appendChild(el('span', { class: 'ux-recover-icon', text: opts.icon }));
    node.appendChild(el('span', { class: 'ux-recover-label', text: opts.label || 'Take action' }));
    if (typeof opts.onClick === 'function') {
      node.addEventListener('click', function (e) {
        e.preventDefault();
        opts.onClick(e);
      });
    }
    return node;
  }

  function autowireRecoverPills(root) {
    var nodes = (root || document).querySelectorAll(
      'a.ux-recover:not([data-ux-recover-wired])'
    );
    nodes.forEach(function (node) {
      node.setAttribute('data-ux-recover-wired', '1');
      // Decorate with icon if none and data-icon is set
      if (node.dataset.icon && !node.querySelector('.ux-recover-icon')) {
        var icon = el('span', { class: 'ux-recover-icon', text: node.dataset.icon });
        node.insertBefore(icon, node.firstChild);
      }
    });
  }

  // ============================================================
  // Mutation observer for late-rendered nodes
  // ============================================================
  function observeMutations() {
    if (!('MutationObserver' in window)) return;
    var obs = new MutationObserver(function (records) {
      records.forEach(function (r) {
        r.addedNodes.forEach(function (n) {
          if (!(n instanceof Element)) return;
          wireConfirmAttrs(n);
          autowireBurndowns(n);
          autowireFilterChips(n);
          autowireRecoverPills(n);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================================
  // Boot
  // ============================================================
  function boot() {
    wireConfirmAttrs(document);
    autowireBurndowns(document);
    autowireFilterChips(document);
    autowireRecoverPills(document);
    maybeInjectTopbarHint();
    observeMutations();
  }

  // ============================================================
  // Public API
  // ============================================================
  window.UX = Object.assign(window.UX || {}, {
    __initialized: true,
    confirm: showConfirm,
    growl: showUndoGrowl,
    bumpBurndown: bumpBurndown,
    refreshBurndown: updateBurndown,
    cheatsheet: renderCheatsheet,
    renderFilterChips: renderFilterChips,
    recoverPill: recoverPill,
    // pages can override or set this — default no-op
    removeFilter: window.UX && window.UX.removeFilter
      ? window.UX.removeFilter
      : function () {},
    shortcuts: (window.UX && window.UX.shortcuts) || null,
    filters: (window.UX && window.UX.filters) || null,
    _rewire: boot
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
