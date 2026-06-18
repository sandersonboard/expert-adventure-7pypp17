/* ============================================================
   Evidence-flow runtime.
   Exposes window.Flow with helpers, and auto-injects the state
   strip / boundary banner / reject modal based on body data
   attributes. Idempotent — safe to re-run.

   Body data attrs read:
     data-flow-category : "flow-native" | "downstream" | "upstream" | "overview"
     data-flow-step     : "draft" | "open" | "submitted" | "accepted"
     data-flow-count    : optional integer (e.g. "2847")
     data-flow-actors   : optional JSON override for actor names

   Loads AFTER nav-routing.js + ds-toggle.js so chrome is in place.
   ============================================================ */

(function () {
  'use strict';

  // ---------- Hardcoded actor/state data ----------
  var ACTORS = {
    auditor:  { name: 'Sarah Kim',    role: 'Audit Lead' },
    assignee: { name: 'Marcus Chen',  role: 'IT Operations' },
    reviewer: { name: 'David Park',   role: 'Senior Auditor' }
  };
  var STATES = ['draft', 'open', 'submitted', 'accepted'];
  var STATE_LABELS = {
    draft: 'Draft',
    open: 'Open',
    submitted: 'Submitted',
    accepted: 'Accepted'
  };
  var UP_NEXT_BY_STATE = {
    draft: 'auditor',
    open: 'assignee',
    submitted: 'reviewer',
    accepted: null
  };

  var REJECT_REASONS = [
    'Missing approver name or signature',
    'Wrong period covered',
    'Incomplete data / missing fields',
    'Duplicate of prior submission',
    'Stale evidence (> 60 days old)',
    'Missing supporting attachment',
    'Other (free text)'
  ];

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
        } else if (props[k] != null) {
          node.setAttribute(k, props[k]);
        }
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        if (typeof c === 'string') node.appendChild(document.createTextNode(c));
        else node.appendChild(c);
      });
    }
    return node;
  }

  function fmtCount(n) {
    var v = Number(n);
    if (!isFinite(v)) return null;
    return v.toLocaleString('en-US');
  }

  function initials(name) {
    return (name || '?')
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (s) { return s.charAt(0).toUpperCase(); })
      .join('');
  }

  function getActors() {
    var raw = document.body.getAttribute('data-flow-actors');
    if (!raw) return ACTORS;
    try {
      var parsed = JSON.parse(raw);
      return {
        auditor:  Object.assign({}, ACTORS.auditor,  parsed.auditor  || {}),
        assignee: Object.assign({}, ACTORS.assignee, parsed.assignee || {}),
        reviewer: Object.assign({}, ACTORS.reviewer, parsed.reviewer || {})
      };
    } catch (e) {
      return ACTORS;
    }
  }

  // Deterministic 64-hex-char "sha" from a string — for prototype use only.
  function fakeSha256(input) {
    var s = String(input || '');
    // 32-bit FNV-1a-ish hash
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    // expand to 64 hex chars by chained re-hashing
    var out = '';
    var cur = h;
    while (out.length < 64) {
      cur = ((cur * 0x01000193) ^ (cur >>> 7) ^ (out.length * 2654435761)) >>> 0;
      out += ('00000000' + cur.toString(16)).slice(-8);
    }
    return out.slice(0, 64);
  }

  // ---------- Primitive builders (return DOM nodes) ----------

  function buildStateBadge(step, count) {
    var label = STATE_LABELS[step] || step;
    var badge = el('span', {
      class: 'flow-state-badge',
      'data-state': step
    }, [
      el('span', { class: 'flow-state-dot' }),
      document.createTextNode(label)
    ]);
    var countText = fmtCount(count);
    if (countText) {
      badge.appendChild(el('span', { class: 'flow-state-count', text: countText }));
    }
    return badge;
  }

  /**
   * Build the 4-state ribbon.
   *   currentStep: highlighted state (flow-native)
   *   boundary:    'before' | 'after' | null — for upstream / downstream views,
   *                renders a "You are here" marker outside the 4 stops so the
   *                viewer always sees the full flow regardless of category.
   */
  function buildRibbon(currentStep, boundary) {
    var idx = STATES.indexOf(currentStep);
    var ribbon = el('span', {
      class: 'flow-ribbon',
      'data-current': currentStep || '',
      'data-boundary': boundary || ''
    });

    if (boundary === 'before') {
      ribbon.appendChild(el('span', {
        class: 'flow-rib-here flow-rib-here-before',
        title: 'You are here — upstream of the flow'
      }, [
        el('span', { class: 'flow-rib-here-arrow', text: '◀' }),
        el('span', { class: 'flow-rib-here-label', text: 'You are here' })
      ]));
      ribbon.appendChild(el('span', { class: 'flow-rib-sep dashed' }));
    }

    STATES.forEach(function (state, i) {
      var tone;
      if (boundary === 'before') {
        tone = 'future';
      } else if (boundary === 'after') {
        tone = 'prior';
      } else {
        tone = i < idx ? 'prior' : (i === idx ? 'current' : 'future');
      }
      var step = el('span', {
        class: 'flow-rib-step',
        'data-state': state,
        'data-tone': tone
      }, [
        el('span', { class: 'flow-rib-dot' }),
        el('span', { class: 'flow-rib-label', text: STATE_LABELS[state] })
      ]);
      ribbon.appendChild(step);
      if (i < STATES.length - 1) {
        var sepDashed;
        if (boundary === 'before') sepDashed = true;
        else if (boundary === 'after') sepDashed = false;
        else sepDashed = i >= idx;
        ribbon.appendChild(el('span', {
          class: 'flow-rib-sep' + (sepDashed ? ' dashed' : '')
        }));
      }
    });

    if (boundary === 'after') {
      ribbon.appendChild(el('span', { class: 'flow-rib-sep dashed' }));
      ribbon.appendChild(el('span', {
        class: 'flow-rib-here flow-rib-here-after',
        title: 'You are here — downstream of the flow'
      }, [
        el('span', { class: 'flow-rib-here-label', text: 'You are here' }),
        el('span', { class: 'flow-rib-here-arrow', text: '▶' })
      ]));
    }

    return ribbon;
  }

  function buildActorChip(role, actor) {
    return el('span', {
      class: 'flow-actor-chip',
      'data-role': role,
      title: actor.name + ' · ' + actor.role
    }, [
      el('span', { class: 'flow-actor-av', text: initials(actor.name) }),
      el('span', { class: 'flow-actor-name', text: actor.name }),
      el('span', { class: 'flow-actor-role', text: '· ' + actor.role }),
      el('span', { class: 'flow-actor-upnext', text: 'Up next' })
    ]);
  }

  function buildActorStrip(currentStep, actorsOverride) {
    var actors = actorsOverride || getActors();
    var upNext = UP_NEXT_BY_STATE[currentStep] || '';
    var strip = el('span', {
      class: 'flow-actor-strip',
      'data-current': upNext,
      'data-state': currentStep
    });
    strip.appendChild(buildActorChip('auditor',  actors.auditor));
    strip.appendChild(buildActorChip('assignee', actors.assignee));
    strip.appendChild(buildActorChip('reviewer', actors.reviewer));
    return strip;
  }

  function buildShaChipNode(filename) {
    var hash = fakeSha256(filename);
    var short = hash.slice(0, 8) + '…' + hash.slice(-8);
    return el('span', {
      class: 'flow-sha-chip',
      title: 'sha256: ' + hash + (filename ? '\n' + filename : '')
    }, [
      el('span', { class: 'flow-sha-key', text: 'sha256' }),
      el('span', { class: 'flow-sha-val', text: short })
    ]);
  }

  // ---------- Compact pill (slim ribbon inside popover) ----------

  /**
   * Build the 4-stop slim ribbon rendered INSIDE the popover.
   * currentStep: highlighted state (flow-native)
   * boundary:    'before' | 'after' | null
   */
  function buildPillRibbon(currentStep, boundary) {
    var idx = STATES.indexOf(currentStep);
    var wrap = el('div', { class: 'flow-pill-ribbon' });

    if (boundary === 'before') {
      wrap.appendChild(el('span', {
        class: 'flow-pill-here before',
        title: 'You are here — upstream of the flow'
      }, [
        document.createTextNode('◀ '),
        document.createTextNode('You are here')
      ]));
    }

    STATES.forEach(function (state, i) {
      var tone;
      if (boundary === 'before') tone = 'future';
      else if (boundary === 'after') tone = 'prior';
      else tone = i < idx ? 'prior' : (i === idx ? 'current' : 'future');

      wrap.appendChild(el('div', {
        class: 'flow-pill-rib-step',
        'data-state': state,
        'data-tone': tone
      }, [
        el('span', { class: 'flow-pill-rib-dot' }),
        el('span', { class: 'flow-pill-rib-label', text: STATE_LABELS[state] })
      ]));
    });

    if (boundary === 'after') {
      wrap.appendChild(el('span', {
        class: 'flow-pill-here after',
        title: 'You are here — downstream of the flow'
      }, [
        document.createTextNode('You are here'),
        document.createTextNode(' ▶')
      ]));
    }
    return wrap;
  }

  function buildPillActor(role, actor, isUpNext) {
    return el('span', {
      class: 'flow-pill-actor',
      'data-role': role,
      title: actor.name + ' · ' + actor.role
    }, [
      el('span', { class: 'flow-pill-actor-dot' }),
      el('span', { class: 'flow-pill-actor-name', text: actor.name }),
      el('span', { class: 'flow-pill-actor-upnext', text: 'Up next' })
    ]);
  }

  function buildPillActors(currentStep, actorsOverride) {
    var actors = actorsOverride || getActors();
    var upNext = UP_NEXT_BY_STATE[currentStep] || '';
    var row = el('div', {
      class: 'flow-pill-actors',
      'data-current': upNext,
      'data-state': currentStep || ''
    });
    row.appendChild(buildPillActor('auditor',  actors.auditor));
    row.appendChild(buildPillActor('assignee', actors.assignee));
    row.appendChild(buildPillActor('reviewer', actors.reviewer));
    return row;
  }

  /**
   * Build the closed-state pill button (lives on the right of .app-breadcrumb).
   * category: 'flow-native' | 'downstream' | 'upstream' | 'overview'
   * step:     current state (flow-native only)
   * count:    optional count string
   */
  function buildPill(category, step, count) {
    var pill = el('button', {
      type: 'button',
      class: 'flow-pill',
      'aria-expanded': 'false',
      'aria-haspopup': 'true'
    });

    if (category === 'flow-native' && step && STATES.indexOf(step) !== -1) {
      pill.setAttribute('data-state', step);
      pill.appendChild(el('span', { class: 'flow-pill-dot', 'data-state': step }));
      pill.appendChild(el('span', { class: 'flow-pill-state', text: STATE_LABELS[step] }));
      var c = fmtCount(count);
      if (c) pill.appendChild(el('span', { class: 'flow-pill-count', text: c }));
    } else if (category === 'downstream') {
      pill.setAttribute('data-category', 'downstream');
      pill.appendChild(el('span', { class: 'flow-pill-dot', 'data-state': 'accepted' }));
      pill.appendChild(el('span', { class: 'flow-pill-state', text: 'After accepted' }));
      pill.appendChild(el('span', { class: 'flow-pill-arrow', 'aria-hidden': 'true', text: '▶' }));
    } else if (category === 'upstream') {
      pill.setAttribute('data-category', 'upstream');
      pill.appendChild(el('span', { class: 'flow-pill-arrow', 'aria-hidden': 'true', text: '◀' }));
      pill.appendChild(el('span', { class: 'flow-pill-dot', 'data-state': 'draft' }));
      pill.appendChild(el('span', { class: 'flow-pill-state', text: 'Before draft' }));
    } else if (category === 'overview') {
      pill.setAttribute('data-category', 'overview');
      pill.appendChild(el('span', { class: 'flow-pill-dot' }));
      pill.appendChild(el('span', { class: 'flow-pill-state', text: 'All 4 states' }));
    } else {
      return null;
    }

    pill.appendChild(el('span', { class: 'flow-pill-caret', 'aria-hidden': 'true', text: '▾' }));
    return pill;
  }

  /**
   * Build the popover panel (initially hidden).
   * Contains ribbon + actor row + a 1-line contextual link.
   */
  function buildPopover(category, step, actors) {
    var pop = el('div', {
      class: 'flow-pill-popover',
      role: 'dialog',
      'aria-label': 'Evidence flow context'
    });

    var boundary = category === 'upstream' ? 'before'
                 : category === 'downstream' ? 'after'
                 : null;

    pop.appendChild(buildPillRibbon(step, boundary));

    // Actor row — for overview show all three without an "up next" highlight.
    var actorStep = category === 'flow-native' ? step : '';
    pop.appendChild(buildPillActors(actorStep, actors));

    // Footer: one-line contextual link / action
    var foot = el('div', { class: 'flow-pill-foot' });
    if (category === 'flow-native' && step === 'submitted') {
      foot.innerHTML =
        'Reviewer is up next. Need a fix? ' +
        '<a href="#" data-flow-reject>Send back to assignee &rarr;</a>';
    } else if (category === 'downstream') {
      foot.innerHTML =
        'Operates on <b>accepted-and-linked</b> evidence · ' +
        '<a href="option-1-clusters.html">Evidence Review &rarr;</a>';
    } else if (category === 'upstream') {
      foot.innerHTML =
        'Configures requests that land in <b>Open</b> · ' +
        '<a href="option-1-clusters.html">Reviewer queue &rarr;</a>';
    } else if (category === 'overview') {
      foot.innerHTML =
        'Four states · three roles · one accepted artifact at the end.';
    } else if (category === 'flow-native') {
      // generic fallback for other flow-native states
      var upNextRole = UP_NEXT_BY_STATE[step];
      if (upNextRole && actors[upNextRole]) {
        foot.innerHTML = '<b>' + escapeHtml(actors[upNextRole].name) +
          '</b> (' + escapeHtml(actors[upNextRole].role) + ') is up next.';
      } else {
        foot.innerHTML = 'Evidence is <b>accepted</b> — no further action required.';
      }
    }
    if (foot.innerHTML) pop.appendChild(foot);

    return pop;
  }

  // ---------- Pill injection + open/close wiring ----------
  var pillState = {
    host: null,
    pill: null,
    popover: null,
    open: false,
    onDocClick: null,
    onKeydown: null
  };

  function closePill() {
    if (!pillState.open || !pillState.pill || !pillState.popover) return;
    pillState.pill.setAttribute('aria-expanded', 'false');
    pillState.popover.classList.remove('open');
    pillState.open = false;
    if (pillState.onDocClick) {
      document.removeEventListener('click', pillState.onDocClick, true);
      pillState.onDocClick = null;
    }
    if (pillState.onKeydown) {
      document.removeEventListener('keydown', pillState.onKeydown, true);
      pillState.onKeydown = null;
    }
  }

  function openPill() {
    if (pillState.open || !pillState.pill || !pillState.popover) return;
    pillState.pill.setAttribute('aria-expanded', 'true');
    pillState.popover.classList.add('open');
    pillState.open = true;

    pillState.onDocClick = function (e) {
      if (!pillState.host || pillState.host.contains(e.target)) return;
      closePill();
    };
    pillState.onKeydown = function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closePill();
        try { pillState.pill.focus(); } catch (err) { /* ignore */ }
      }
    };
    document.addEventListener('click', pillState.onDocClick, true);
    document.addEventListener('keydown', pillState.onKeydown, true);
  }

  function togglePill() {
    if (pillState.open) closePill(); else openPill();
  }

  function injectPill() {
    // Idempotent — remove any prior injection.
    var existing = document.querySelector('.flow-pill-host[data-flow-injected="true"]');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    // Also nuke any legacy strip/banner that older HTML pages may carry.
    document.querySelectorAll('.flow-state-strip[data-flow-injected="true"], .flow-boundary[data-flow-injected="true"]').forEach(function (n) {
      if (n.parentNode) n.parentNode.removeChild(n);
    });

    var category = document.body.getAttribute('data-flow-category');
    if (!category) return;

    var step = document.body.getAttribute('data-flow-step');
    var count = document.body.getAttribute('data-flow-count');
    var actors = getActors();

    var pill = buildPill(category, step, count);
    if (!pill) return;

    var popover = buildPopover(category, step, actors);

    var host = el('div', {
      class: 'flow-pill-host',
      'data-flow-injected': 'true',
      'data-flow-category': category
    }, [pill, popover]);

    pill.addEventListener('click', function (e) {
      // Avoid the document-level click handler from immediately closing it.
      e.stopPropagation();
      togglePill();
    });
    // Stop popover clicks from bubbling to the document close handler,
    // EXCEPT for the [data-flow-reject] link which we want to fire the reject modal.
    popover.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-flow-reject]')) {
        // close popover first so modal isn't visually overlapped
        closePill();
        return; // let the global reject handler take over
      }
      e.stopPropagation();
    });

    pillState.host = host;
    pillState.pill = pill;
    pillState.popover = popover;
    pillState.open = false;

    var bc = document.querySelector('.app-breadcrumb');
    if (bc) {
      bc.appendChild(host);
    } else {
      // Fallback: just stash it at the top of body — shouldn't happen in practice.
      document.body.insertBefore(host, document.body.firstChild);
    }
  }

  function autoInject() {
    injectPill();
  }

  // ---------- Reject modal ----------
  var rejectModalState = {
    backdrop: null,
    modal: null,
    open: false,
    lastFocus: null,
    onSubmit: null,
    assignee: null,
    onKeydown: null
  };

  function ensureRejectModal() {
    if (rejectModalState.modal) return;

    var backdrop = el('div', {
      class: 'flow-reject-backdrop',
      'data-flow-injected': 'true'
    });

    var heading = el('h3');
    var subhead = el('div', { class: 'flow-reject-sub', text: 'Returns to the assignee with reasons — they\'ll fix and resubmit.' });
    var headWrap = el('div', null, [heading, subhead]);
    var closeBtn = el('button', {
      class: 'flow-reject-close',
      type: 'button',
      'aria-label': 'Cancel'
    }, '×');
    var head = el('div', { class: 'flow-reject-head' }, [headWrap, closeBtn]);

    var prompt = el('p', {
      class: 'flow-reject-prompt',
      text: 'Pick one or more reasons. The assignee sees these verbatim along with your notes.'
    });

    var reasonsList = el('div', { class: 'flow-reject-reasons' });
    REJECT_REASONS.forEach(function (text, i) {
      var cb = el('input', { type: 'checkbox', 'data-reason-idx': i });
      var label = el('label', {
        class: 'flow-reject-reason',
        'data-reason-idx': i
      }, [cb, document.createTextNode(text)]);
      cb.addEventListener('change', function () {
        label.classList.toggle('checked', cb.checked);
        updateSubmitState();
      });
      reasonsList.appendChild(label);
    });

    var notesLabel = el('label', { class: 'flow-reject-notes-label', text: 'Notes (optional)' });
    var notes = el('textarea', {
      class: 'flow-reject-notes',
      placeholder: 'Anything else the assignee needs to know to fix this...'
    });

    var body = el('div', { class: 'flow-reject-body' }, [prompt, reasonsList, notesLabel, notes]);

    var hint = el('span', {
      class: 'flow-reject-hint',
      text: 'AI assists. You decide.'
    });
    var cancel = el('button', { class: 'btn subtle', type: 'button' }, 'Cancel');
    var send = el('button', { class: 'btn flow-reject-send', type: 'button', disabled: 'true' }, 'Send back');
    var actions = el('div', { class: 'flow-reject-actions' }, [cancel, send]);
    var foot = el('div', { class: 'flow-reject-foot' }, [hint, actions]);

    var modal = el('div', {
      class: 'flow-reject-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'flow-reject-heading',
      'data-flow-injected': 'true'
    }, [head, body, foot]);
    heading.id = 'flow-reject-heading';

    function updateSubmitState() {
      var checked = reasonsList.querySelectorAll('input[type="checkbox"]:checked').length;
      if (checked > 0) {
        send.removeAttribute('disabled');
      } else {
        send.setAttribute('disabled', 'true');
      }
    }

    function getReasons() {
      var out = [];
      reasonsList.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
        var idx = Number(cb.getAttribute('data-reason-idx'));
        out.push(REJECT_REASONS[idx]);
      });
      return out;
    }

    function trapFocus(e) {
      if (!rejectModalState.open) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        closeRejectModal();
        return;
      }
      if (e.key !== 'Tab' && e.keyCode !== 9) return;
      var focusables = modal.querySelectorAll(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    }

    closeBtn.addEventListener('click', closeRejectModal);
    cancel.addEventListener('click', closeRejectModal);
    backdrop.addEventListener('click', closeRejectModal);
    send.addEventListener('click', function () {
      var reasons = getReasons();
      if (!reasons.length) return;
      var notesVal = notes.value.trim();
      var assignee = rejectModalState.assignee || 'the assignee';
      var cb = rejectModalState.onSubmit;
      closeRejectModal();
      if (typeof cb === 'function') {
        try { cb(reasons, notesVal); } catch (e) { /* swallow */ }
      }
      growl(
        'Sent back to <b>' + escapeHtml(assignee) + '</b> with ' + reasons.length +
        ' reason' + (reasons.length === 1 ? '' : 's') + ' — they\'ll resubmit.'
      );
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    rejectModalState.backdrop = backdrop;
    rejectModalState.modal = modal;
    rejectModalState.heading = heading;
    rejectModalState.send = send;
    rejectModalState.reasonsList = reasonsList;
    rejectModalState.notes = notes;
    rejectModalState.trapFocus = trapFocus;
    rejectModalState.updateSubmitState = updateSubmitState;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openRejectModal(opts) {
    ensureRejectModal();
    opts = opts || {};
    var assignee = opts.assignee || getActors().assignee.name;
    rejectModalState.assignee = assignee;
    rejectModalState.onSubmit = opts.onSubmit || null;
    rejectModalState.lastFocus = document.activeElement;

    rejectModalState.heading.innerHTML =
      'Reject and return to <b>' + escapeHtml(assignee) + '</b>';
    rejectModalState.send.textContent = 'Send back to ' + assignee;

    // Reset reasons + notes for a fresh open
    rejectModalState.reasonsList.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = false;
      var lbl = cb.closest('.flow-reject-reason');
      if (lbl) lbl.classList.remove('checked');
    });
    rejectModalState.notes.value = '';
    rejectModalState.updateSubmitState();

    rejectModalState.backdrop.classList.add('open');
    rejectModalState.modal.classList.add('open');
    rejectModalState.open = true;

    document.addEventListener('keydown', rejectModalState.trapFocus, true);
    setTimeout(function () {
      var firstReason = rejectModalState.reasonsList.querySelector('input[type="checkbox"]');
      if (firstReason) firstReason.focus();
    }, 60);
  }

  function closeRejectModal() {
    if (!rejectModalState.open) return;
    rejectModalState.backdrop.classList.remove('open');
    rejectModalState.modal.classList.remove('open');
    rejectModalState.open = false;
    document.removeEventListener('keydown', rejectModalState.trapFocus, true);
    if (rejectModalState.lastFocus && typeof rejectModalState.lastFocus.focus === 'function') {
      try { rejectModalState.lastFocus.focus(); } catch (e) { /* ignore */ }
    }
  }

  // Auto-wire any [data-flow-reject] click
  function wireRejectTriggers() {
    if (document.body.__flowRejectWired) return;
    document.body.__flowRejectWired = true;
    document.addEventListener('click', function (e) {
      var trigger = e.target && e.target.closest && e.target.closest('[data-flow-reject]');
      if (!trigger) return;
      e.preventDefault();
      var assignee = trigger.getAttribute('data-assignee') || getActors().assignee.name;
      openRejectModal({ assignee: assignee });
    });
  }

  // ---------- Growl toast ----------
  function ensureGrowlHost() {
    var host = document.querySelector('.growl-host');
    if (host) return host;
    host = el('div', { class: 'growl-host' });
    document.body.appendChild(host);
    return host;
  }

  function growl(html) {
    var host = ensureGrowlHost();
    var node = el('div', { class: 'growl success' }, [
      el('span', { class: 'growl-icon' }),
      el('span', { html: html })
    ]);
    host.appendChild(node);
    setTimeout(function () {
      node.style.transition = 'opacity 240ms ease, transform 240ms ease';
      node.style.opacity = '0';
      node.style.transform = 'translateY(6px)';
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 280);
    }, 4200);
  }

  // ---------- Public API ----------
  window.Flow = {
    ACTORS: ACTORS,
    STATES: STATES,
    STATE_LABELS: STATE_LABELS,
    REJECT_REASONS: REJECT_REASONS,

    // Returns HTML string for a SHA chip with a deterministic hash from `filename`.
    shaChip: function (filename) {
      var hash = fakeSha256(filename);
      var short = hash.slice(0, 8) + '…' + hash.slice(-8);
      var title = 'sha256: ' + hash + (filename ? ' — ' + filename : '');
      return '<span class="flow-sha-chip" title="' + escapeHtml(title) + '">' +
        '<span class="flow-sha-key">sha256</span>' +
        '<span class="flow-sha-val">' + escapeHtml(short) + '</span>' +
        '</span>';
    },

    // DOM-node version (handy when you want to append instead of innerHTML).
    shaChipNode: buildShaChipNode,

    // Hash a string the same way as the chips (for callers that need raw hashes).
    fakeSha256: fakeSha256,

    // Primitive builders (return DOM nodes).
    buildStateBadge: buildStateBadge,
    buildRibbon: buildRibbon,
    buildActorStrip: buildActorStrip,

    // Pill primitives (used by autoInject; exposed for advanced callers).
    buildPill: buildPill,
    buildPopover: buildPopover,
    buildPillRibbon: buildPillRibbon,
    buildPillActors: buildPillActors,
    openPill: openPill,
    closePill: closePill,

    // Programmatic modal open.
    openRejectModal: openRejectModal,
    closeRejectModal: closeRejectModal,

    // Re-run injection (e.g. after dynamic content rewrites the chrome).
    refresh: function () {
      autoInject();
      wireRejectTriggers();
    },

    // Manual growl-toast (uses .growl-host from chrome.css).
    growl: growl
  };

  // ---------- Boot ----------
  function boot() {
    autoInject();
    wireRejectTriggers();
    ensureRejectModal(); // pre-build so first open is snappy
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
