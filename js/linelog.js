/* ==========================================================================
   Bookstore Journey — the line log, for the language check (docs/VOICEOVER.md)
   Only with ?log=right, ?log=wrong or ?log=1 in the address. It saves every line
   as it appears, screen by screen: each line a character says (in a bubble, a
   thought, or with no bubble), with its clip, and the words
   written on the screen (titles, cards, questions, answers, buttons). The log is
   kept in this browser across reloads, so the game can be played once with every
   answer right (?log=right) and once with every answer wrong, drag mistakes too
   (?log=wrong). L saves it all as a spreadsheet (CSV): one row per line, in
   order, a line both paths meet listed once, as "All". Shift+L empties the log.
   ========================================================================== */
(function () {
  'use strict';

  const mode = (location.search.match(/[?&]log=(\w+)/) || [])[1];
  if (!mode || mode === '0') return;
  const PATH = /^(right|wrong)$/i.test(mode) ? mode.toLowerCase() : '';
  const STORE = 'bj.log';
  const WHO = { boy: 'Aniket', man: 'Shopkeeper', dad: 'Father', bird: 'Swifty' };
  const CLIPS = typeof VO_LINES === 'object' ? VO_LINES : {};
  const run = Date.now();

  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem(STORE)) || [];
  } catch (e) { /* storage blocked: this visit's lines only */ }

  // A line as the voice map keys it: no highlight marks, every kind of space (and line break) one space.
  const tidy = s => String(s).replace(/[{}*]/g, '').replace(/\s+/g, ' ').trim();
  // Words written on the screen: the same, and a short form in brackets apart from its name ("Marked Price (MP)").
  const tidyShown = s => tidy(s).replace(/(\w)\(/g, '$1 (').replace(/(\S)✓/g, '$1 ✓');

  // The screen on now (the scene list marks it), with its name and its element.
  let at = -1;
  let visit = 0;
  let seen = new Set(); // what this visit has logged already
  function screen() {
    const items = [...document.querySelectorAll('.scene-item')];
    const i = items.findIndex(b => b.classList.contains('is-current'));
    if (i < 0) return null;
    if (i !== at) {
      at = i;
      visit++;
      seen = new Set();
    }
    return { i, name: items[i].querySelector('strong').textContent, el: document.querySelectorAll('#scenes > .scene')[i] };
  }

  function add(where, who, type, text, clip) {
    seen.add(text);
    rows.push({ r: run, p: PATH, v: visit, n: where.i, s: where.name, w: who, t: type, x: text, c: clip });
    save();
  }

  let saving = 0;
  function save() {
    clearTimeout(saving);
    saving = setTimeout(() => {
      try {
        localStorage.setItem(STORE, JSON.stringify(rows));
      } catch (e) { /* full or blocked: L still saves what this visit has */ }
      badge();
    }, 500);
  }

  // Every spoken line, as it starts (also with the sound off): who says it, and where its words are.
  const say = Voice.say;
  Voice.say = function (id, text, who) {
    const where = screen();
    const line = tidy(text);
    if (where && line) add(where, WHO[who] || who, kindOf(line), line, (CLIPS[line] || [])[0] || '');
    return say.apply(this, arguments);
  };

  function kindOf(line) {
    const squash = s => s.replace(/\s+/g, ''); // (a bubble's kept line break has no space in its text)
    for (const b of document.querySelectorAll('#stage .bubble')) {
      if (!squash(b.textContent).includes(squash(line))) continue;
      return b.classList.contains('thought') ? 'Thought cloud' : 'Speech bubble';
    }
    return 'Spoken (no bubble)';
  }

  // The words written in `root` that can be seen, one line per block of text on the screen: a line break written in a
  // text is a space; a title or a question set as several lines of one kind (two spans, two .q-line) is one line; a
  // sum's signs stay with their numbers, and "(MP)" with its name. Bubbles are left out (their lines are logged as they
  // are said), and so are the letters on the answers' chips (A, B, C) and the big Next button (the same on every screen).
  function linesOf(root) {
    const parts = [];
    let now = null;
    const put = (text, owner) => {
      if (!now || now.owner !== owner) parts.push(now = { owner, text: '' });
      now.text += text;
    };
    (function walk(node, owner) {
      for (const c of node.childNodes) {
        if (c.nodeType === 3) put(c.textContent, owner);
        else if (c.nodeType === 1 && c.tagName === 'BR') put(' ', owner);
        else if (c.nodeType === 1 && !c.matches('.bubble')) {
          const cs = getComputedStyle(c);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
          walk(c, /^(inline|contents)/.test(cs.display) ? owner : c);
        }
      }
    })(root, root);
    const out = [];
    let glue = false;
    let last = null;
    for (const { owner, text } of parts) {
      const l = tidyShown(text);
      if (!l) continue;
      const sign = /^[=−×÷+→]$/.test(l);
      const kin = last && last.owner.parentElement === owner.parentElement && last.owner.tagName === owner.tagName &&
        last.owner.className === owner.className && owner.tagName !== 'BUTTON' && !/[.!?:]$/.test(last.text);
      if (last && (sign || glue || kin || /^\([^()]{1,12}\)$/.test(l))) last.text += ' ' + l;
      else out.push(last = { owner, text: l });
      glue = sign;
    }
    return out.filter(o => !/^[A-D]$/.test(o.text) && /[\p{L}\p{N}]/u.test(o.text));
  }

  // A text that grows on the screen (a definition written word by word, an amount coming into a question) is one line:
  // its row takes each longer version, as long as it keeps the words it had.
  const within = (a, b) => {
    const words = b.split(' ');
    let k = 0;
    return a.split(' ').every(w => (k = words.indexOf(w, k) + 1) > 0);
  };
  let rowOf = new Map(); // on this visit: a block on the screen → its row
  let rowsVisit = -1;
  function look() {
    const where = screen();
    if (!where || !where.el) return;
    if (rowsVisit !== visit) {
      rowsVisit = visit;
      rowOf = new Map();
    }
    const type = 'On-screen text';
    linesOf(where.el).forEach(({ owner, text }) => {
      if (seen.has(text)) return;
      const row = rowOf.get(owner);
      if (row && row.t === type && within(row.x, text)) {
        seen.delete(row.x); // (its shorter text may still come elsewhere on the screen, e.g. a card's title)
        seen.add(row.x = text);
        save();
        return;
      }
      add(where, 'On screen', type, text, '');
      rowOf.set(owner, rows[rows.length - 1]);
    });
  }
  setInterval(look, 400);

  // ---------- the spreadsheet ----------

  // Words a language edit must leave as they are: formulas, amounts, numbers, the maths terms, the names.
  const FORMULA = /[\w₹%(](?:[^.!?;:,]|,(?=\d))*?=(?:[^.!?;,]|,(?=\d))*/g;
  const TERMS = /\b(?:Marked Price|Selling Price|Cost Price|Discount Percentage|Discount %|Discount|Percentage|Part|Whole|MP|SP|CP|Aniket|Swifty)(?!\w)/gi;
  const AMOUNTS = /₹\s?\d(?:[\d,]*\d)?|\b\d+(?:\.\d+)?%|\b\d(?:[\d,]*\d)?\b/g;
  function keep(text) {
    const formulas = (text.match(FORMULA) || []).map(f => f.trim());
    const inside = w => formulas.some(f => f.includes(w));
    const words = [...(text.match(AMOUNTS) || []), ...(text.match(TERMS) || [])].filter(w => !inside(w));
    return [...new Set([...formulas, ...words])].join('; ');
  }

  // Merges a visit's lines into the lines of the screen's visits so far, in order (the longest run they share kept once).
  function merge(a, b) {
    const L = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        L[i][j] = a[i].key === b[j].key ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i].key === b[j].key) {
        b[j].paths.forEach(p => a[i].paths.add(p));
        out.push(a[i++]);
        j++;
      } else if (L[i + 1][j] >= L[i][j + 1]) {
        out.push(a[i++]);
      } else {
        out.push(b[j++]);
      }
    }
    return out.concat(a.slice(i), b.slice(j));
  }

  function table() {
    const screens = new Map(); // screen → its visits: { path, items }
    let now = null;
    for (const row of rows) {
      if (!now || now.id !== row.r + ':' + row.v) {
        now = { id: row.r + ':' + row.v, path: row.p, items: [], keys: new Set() };
        if (!screens.has(row.n)) screens.set(row.n, []);
        screens.get(row.n).push(now);
      }
      const key = [row.t, row.w, row.x].join('|');
      if (now.keys.has(key)) continue; // said again on the same visit ("Hear it again")
      now.keys.add(key);
      now.items.push({ key, row, paths: new Set([row.p]) });
    }
    const out = [];
    [...screens.keys()].sort((a, b) => a - b).forEach(n => {
      const visits = screens.get(n);
      const both = visits.some(v => v.path === 'right') && visits.some(v => v.path === 'wrong');
      visits.reduce((all, v) => merge(all, v.items), []).forEach(({ row, paths }) => {
        const path = !both || paths.has('') || (paths.has('right') && paths.has('wrong')) ? 'All'
          : paths.has('right') ? 'Right answer' : 'Wrong answer';
        const clip = row.c || (row.w === 'On screen' ? '' : 'none yet (the device voice reads it)');
        out.push([n, row.s, path, row.w, row.t, row.x, clip, keep(row.x)]);
      });
    });
    // On top of the screens, the same on every one: the notebook's title.
    document.querySelectorAll('#notebook .nb-head h2').forEach(node => {
      const text = tidy(node.textContent);
      if (text) out.push(['—', 'The notebook', 'All', 'On screen', 'Notebook', text, '', keep(text)]);
    });
    return out;
  }

  function csv() {
    const head = ['#', 'Screen', 'Screen name', 'Path', 'Who', 'Type', 'Text', 'Voice clip', 'Words that must not change'];
    const cell = v => '"' + String(v).replace(/"/g, '""') + '"';
    return '﻿' + [head, ...table().map((r, k) => [k + 1, ...r])].map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
  }

  function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv;charset=utf-8' }));
    a.download = 'bookstore-journey-lines.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // What is being logged, bottom left.
  const tag = document.createElement('div');
  tag.className = 'dev-log';
  document.body.appendChild(tag);
  function badge() {
    tag.textContent = `Logging lines${PATH ? ` (${PATH} answers)` : ''}: ${rows.length} so far · L saves them · Shift+L clears`;
  }
  badge();

  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.key.toLowerCase() !== 'l') return;
    if (e.shiftKey) {
      rows = [];
      seen = new Set();
      save();
    } else {
      download();
    }
  });

  window.LineLog = { csv, table, rows: () => rows };
})();
